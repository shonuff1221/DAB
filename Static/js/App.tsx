import * as React from "react";
import styled from "styled-components";
import Web3 from "web3";
import { convertUtf8ToHex } from "@walletconnect/utils";

import Web3Modal, { getProviderInfo } from "web3modal";

// @ts-ignore
import WalletConnectProvider from "@walletconnect/web3-provider";
// @ts-ignore

import Column from "./components/Column";
import Modal from "./components/Modal";
import Loader from "./components/Loader";
import ModalResult from "./components/ModalResult";

import {
  hashPersonalMessage,
  recoverPublicKey,
  recoverPersonalSignature,
  formatTestTransaction,
  getChainData
} from "./helpers/utilities";
import { IAssetData, IBoxProfile } from "./helpers/types";
import { openBox, getProfile } from "./helpers/box";
import {
  ETH_SEND_TRANSACTION,
  ETH_SIGN,
  PERSONAL_SIGN,
  BOX_GET_PROFILE,
  DAI_BALANCE_OF,
  DAI_TRANSFER
} from "./constants";
import { callBalanceOf, callTransfer } from "./helpers/web3";


import Main from "./Main/Main";
import logo from './Main/DABLogo2.png'

import {
  IconButton,
  //  Button 
} from '@material-ui/core';
import { Close } from '@material-ui/icons';

const SContainer = styled.div`
  height: 100%;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  word-break: break-word;
`;

const SLanding = styled(Column)`
  height: 600px;
`;

const SModalContainer = styled.div`
  width: 100%;
  position: relative;
  word-wrap: break-word;
`;

const SModalTitle = styled.div`
  margin: 1em 0;
  font-size: 20px;
  font-weight: 700;
`;

const SModalParagraph = styled.p`
  margin-top: 30px;
`;

// @ts-ignore
const SBalances = styled(SLanding)`
  height: 100%;
  & h3 {
    padding-top: 30px;
  }
`;



interface IAppState {
  fetching: boolean;
  address: string;
  web3: any;
  web3_np: any,
  provider: any;
  connected: boolean;
  connectionOK: boolean;
  chainId: number;
  networkId: number;
  assets: IAssetData[];
  showModal: boolean;
  pendingRequest: boolean;
  result: any | null;
}

const INITIAL_STATE: IAppState = {
  fetching: false,
  address: "",
  web3: null,
  web3_np: null,
  provider: null,
  connected: false,
  connectionOK: false,
  chainId: 56,
  networkId: 56,
  assets: [],
  showModal: false,
  pendingRequest: false,
  result: null
};

function initWeb3(provider: any) {
  const web3: any = new Web3(provider);

  web3.eth.extend({
    methods: [
      {
        name: "chainId",
        call: "eth_chainId",
        outputFormatter: web3.utils.hexToNumber
      }
    ]
  });

  return web3;
}

class App extends React.Component<any, any> {
  // @ts-ignore
  public web3Modal: Web3Modal;
  public state: IAppState;

  constructor(props: any) {
    super(props);
    this.state = {
      ...INITIAL_STATE
    };

    // let network = this.getNetwork()
    // console.log(network, "network")
    this.web3Modal = new Web3Modal({
      network: "binance", //this.getNetwork(), // "binance", // "mainnet" | "binance" // https://github.com/Web3Modal/web3modal/blob/master/src/constants/chains.ts
      cacheProvider: true,
      providerOptions: this.getProviderOptions()
    });

  }

  public componentDidMount() {
    if (this.web3Modal.cachedProvider) {
      this.onConnect();
    }
  }

  checkIfConnectionOK = async (web3: any) => {

    if (!web3) { web3 = this.state.web3 }
    if (!web3.eth) { return false }

    const provider = await this.web3Modal.connect();

    const networkId = await web3.eth.net.getId();

    let providerInfo = getProviderInfo(provider);

    let connectionOK = false
    if (networkId == 56) {
      connectionOK = true
    }
    if (providerInfo.check == "isWalletConnect") {
      connectionOK = true
    }

    return connectionOK
  }
  public onConnect = async () => {
    const provider = await this.web3Modal.connect();
    // console.log(provider, "provider")


    await this.subscribeProvider(provider);
    // return
    const web3: any = initWeb3(provider);

    const web3_np: any = new Web3("https://bsc-dataseed.binance.org/");
    web3_np.eth.extend({
      methods: [
        {
          name: "chainId",
          call: "eth_chainId",
          outputFormatter: web3_np.utils.hexToNumber
        }
      ]
    });

    const accounts = await web3.eth.getAccounts();

    const address = accounts[0];

    const networkId = await web3.eth.net.getId();

    const chainId = await web3.eth.chainId();

    const connectionOK = await this.checkIfConnectionOK(web3);

    await this.setState({
      connectionOK,
      web3,
      web3_np,
      provider,
      connected: true,
      address,
      chainId,
      networkId
    }, () => { this.state, "this.state" });
  };

  public subscribeProvider = async (provider: any) => {
    if (!provider.on) {
      return;
    }
    provider.on("close", () => this.resetApp());
    provider.on("accountsChanged", async (accounts: string[]) => {
      await this.setState({ address: accounts[0] });
    });
    provider.on("chainChanged", async (chainId: number) => {
      const { web3 } = this.state;
      const networkId = web3.eth ? await web3.eth.net.getId() : 0
      const connectionOK = await this.checkIfConnectionOK(null)

      await this.setState({ connectionOK, chainId, networkId });
    });

    provider.on("networkChanged", async (networkId: number) => {
      const { web3 } = this.state;
      const chainId = web3.eth ? await web3.eth.chainId() : 0
      const connectionOK = await this.checkIfConnectionOK(null)

      await this.setState({ connectionOK, chainId, networkId });
    });
  };

  public getNetwork = () => getChainData(this.state.chainId).network;

  public getProviderOptions = () => {
    const providerOptions = {
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          rpc:
          {
            56: "https://bsc-dataseed.binance.org/"
          },
        }
      },

    };
    return providerOptions;
  };


  public toggleModal = () =>
    this.setState({ showModal: !this.state.showModal });

  public testSendTransaction = async () => {
    const { web3, address, chainId } = this.state;

    if (!web3) {
      return;
    }

    const tx = await formatTestTransaction(address, chainId);

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // @ts-ignore
      function sendTransaction(_tx: any) {
        return new Promise((resolve, reject) => {
          web3.eth
            .sendTransaction(_tx)
            .once("transactionHash", (txHash: string) => resolve(txHash))
            .catch((err: any) => reject(err));
        });
      }

      // send transaction
      const result = await sendTransaction(tx);

      // format displayed result
      const formattedResult = {
        action: ETH_SEND_TRANSACTION,
        txHash: result,
        from: address,
        to: address,
        value: "0 ETH"
      };

      // display result
      this.setState({
        web3,
        pendingRequest: false,
        result: formattedResult || null
      });
    } catch (error) {
      console.error(error); // tslint:disable-line
      this.setState({ web3, pendingRequest: false, result: null });
    }
  };

  public testSignMessage = async () => {
    const { web3, address } = this.state;

    if (!web3) {
      return;
    }

    // test message
    const message = "My email is john@doe.com - 1537836206101";

    // hash message
    const hash = hashPersonalMessage(message);

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send message
      const result = await web3.eth.sign(hash, address);

      // verify signature
      const signer = recoverPublicKey(result, hash);
      const verified = signer.toLowerCase() === address.toLowerCase();

      // format displayed result
      const formattedResult = {
        action: ETH_SIGN,
        address,
        signer,
        verified,
        result
      };

      // display result
      this.setState({
        web3,
        pendingRequest: false,
        result: formattedResult || null
      });
    } catch (error) {
      console.error(error); // tslint:disable-line
      this.setState({ web3, pendingRequest: false, result: null });
    }
  };

  public testSignPersonalMessage = async () => {
    const { web3, address } = this.state;

    if (!web3) {
      return;
    }

    // test message
    const message = "My email is john@doe.com - 1537836206101";

    // encode message (hex)
    const hexMsg = convertUtf8ToHex(message);

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send message
      const result = await web3.eth.personal.sign(hexMsg, address);

      // verify signature
      const signer = recoverPersonalSignature(result, message);
      const verified = signer.toLowerCase() === address.toLowerCase();

      // format displayed result
      const formattedResult = {
        action: PERSONAL_SIGN,
        address,
        signer,
        verified,
        result
      };

      // display result
      this.setState({
        web3,
        pendingRequest: false,
        result: formattedResult || null
      });
    } catch (error) {
      console.error(error); // tslint:disable-line
      this.setState({ web3, pendingRequest: false, result: null });
    }
  };

  public testContractCall = async (functionSig: string) => {
    let contractCall = null;
    switch (functionSig) {
      case DAI_BALANCE_OF:
        contractCall = callBalanceOf;
        break;
      case DAI_TRANSFER:
        contractCall = callTransfer;
        break;

      default:
        break;
    }

    if (!contractCall) {
      throw new Error(
        `No matching contract calls for functionSig=${functionSig}`
      );
    }

    const { web3, address, chainId } = this.state;
    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send transaction
      const result = await contractCall(address, chainId, web3);

      // format displayed result
      const formattedResult = {
        action: functionSig,
        result
      };

      // display result
      this.setState({
        web3,
        pendingRequest: false,
        result: formattedResult || null
      });
    } catch (error) {
      console.error(error); // tslint:disable-line
      this.setState({ web3, pendingRequest: false, result: null });
    }
  };

  public testOpenBox = async () => {
    function getBoxProfile(
      address: string,
      provider: any
    ): Promise<IBoxProfile> {
      return new Promise(async (resolve, reject) => {
        try {
          await openBox(address, provider, async () => {
            const profile = await getProfile(address);
            resolve(profile);
          });
        } catch (error) {
          reject(error);
        }
      });
    }

    const { address, provider } = this.state;

    try {
      // open modal
      this.toggleModal();

      // toggle pending request indicator
      this.setState({ pendingRequest: true });

      // send transaction
      const profile = await getBoxProfile(address, provider);

      let result = null;
      if (profile) {
        result = {
          name: profile.name,
          description: profile.description,
          job: profile.job,
          employer: profile.employer,
          location: profile.location,
          website: profile.website,
          github: profile.github
        };
      }

      // format displayed result
      const formattedResult = {
        action: BOX_GET_PROFILE,
        result
      };

      // display result
      this.setState({
        pendingRequest: false,
        result: formattedResult || null
      });
    } catch (error) {
      console.error(error); // tslint:disable-line
      this.setState({ pendingRequest: false, result: null });
    }
  };

  public resetApp = async () => {
    const { web3 } = this.state;
    if (web3 && web3.currentProvider && web3.currentProvider.close) {
      await web3.currentProvider.close();
    }
    await this.web3Modal.clearCachedProvider();
    this.setState({ ...INITIAL_STATE });
  };


  public renderHeader = () => {

    return <div style={{ backgroundColor: "black", height: "55px", width: "100%" }}>
      <div style={{
        backgroundColor: "", maxWidth: "880px", height: "100%", margin: "auto",
        alignItems: "center",
        display: "flex",
        justifyContent: "space-between",
        width: "100%",
        color: "white"
      }}>

        <div style={{ backgroundColor: "", width: "100%", display: "flex", alignItems: "left", paddingLeft: "8px" }}>
          <img src={logo} width="44.4" height="44.4" alt="" style={{ paddingTop: "0px" }} />
          <div style={{ paddingLeft: "5px" }}>
            <div style={{ fontWeight: "bold", fontSize: 23 }}>DABfarm </div>
            <div style={{ fontSize: 11.1, height: 0, transform: "translate(0px, -5px)" }}> only for true farmers </div>
          </div>
        </div>



        <div style={{ backgroundColor: "", paddingRight: "11px", textAlign: "right" }}>
          {this.state.connected ?

            <div style={{
              backgroundColor: "", maxWidth: "880px", height: "100%", margin: "auto",
              // alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
              width: "100%",
              color: "white"
            }}>
              {this.state.connectionOK ?
                <div style={{ color: "white", width: "100%", display: "flex", alignItems: "left", borderRadius: "20px", backgroundColor: "#383838" }}>
                  <IconButton
                    onClick={this.resetApp}
                    style={{ width: "auto", color: "white", marginLeft: "3px", padding: "6px" }}
                  >
                    <Close />
                  </IconButton>

                  <div style={{ padding: "7px 12px 7px 0px" }}>
                    {this.state.address.slice(0, 5) + "..." + this.state.address.slice(-4)}
                  </div>

                </div>
                :
                <div style={{ color: "white", width: "100%", display: "flex", alignItems: "left", borderRadius: "20px", backgroundColor: "rgb(135 0 0)" }}>
                  <IconButton
                    onClick={this.resetApp}
                    style={{ width: "auto", color: "white", marginLeft: "3px", padding: "6px" }}
                  >
                    <Close />
                  </IconButton>

                  <div style={{ whiteSpace: "nowrap", padding: "7px 12px 7px 0px" }}>
                    Wrong Network
                  </div>

                </div>
              }

            </div>

            :


            <div

              onClick={this.onConnect}

              style={{ color: "white", width: "100%", display: "flex", alignItems: "left", borderRadius: "20px", backgroundColor: "#383838" }}>
              <div style={{ cursor: "pointer", whiteSpace: "nowrap", padding: "8px 12px 8px 12px", fontSize: "16px" }}>
                Connect Wallet
              </div>

            </div>



          }

        </div>


      </div>
    </div >

  }



  public render = () => {
    const {
      connected,
      showModal,
      pendingRequest,
      result
    } = this.state;
    return (
      <div>

        <Modal show={showModal} toggleModal={this.toggleModal}>
          {pendingRequest ? (
            <SModalContainer>
              <SModalTitle>{"Pending Call Request"}</SModalTitle>
              <SContainer>
                <Loader />
                <SModalParagraph>
                  {"Approve or reject request using your wallet"}
                </SModalParagraph>
              </SContainer>
            </SModalContainer>
          ) : result ? (
            <SModalContainer>
              <SModalTitle>{"Call Request Approved"}</SModalTitle>
              <ModalResult>{result}</ModalResult>
            </SModalContainer>
          ) : (
                <SModalContainer>
                  <SModalTitle>{"Call Request Rejected"}</SModalTitle>
                </SModalContainer>
              )}
        </Modal>

        {this.renderHeader()}

        <Main
          connectionOK={this.state.connectionOK}
          connected={connected}
          chainId={this.state.chainId}
          address={this.state.address}
          web3={this.state.web3}
          web3_np={this.state.web3_np}
        />


      </div>

    );
  };
}

export default App;
