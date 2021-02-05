// tslint:disable:no-console

import * as React from 'react'
import { BrowserView, MobileView, isBrowser, isMobile } from "react-device-detect";

import axios from 'axios'
import { ethers } from 'ethers';
import {BigNumber} from '@ethersproject/bignumber'      // Also works requires BigNumber.from()

import commaNumber from 'comma-number'
import constants from './constants'

import { Grid, IconButton, Tooltip, Button } from '@material-ui/core';
import { Add, Remove } from '@material-ui/icons';

import { createMuiTheme, MuiThemeProvider } from "@material-ui/core/styles";
import MUIDataTable from "mui-datatables";  // https://www.npmjs.com/package/mui-datatables

import DepositWithdrawButtons from './DepositWithdrawButtons'
import BotNavBar from './BotNavBar'

import ERC20 from './abis/ERC20.json'
import AutoFarm from './abis/AutoFarm.json'

import DateCountdown from 'react-date-countdown-timer';

import CountdownTimer from "react-component-countdown-timer";
import "./Countdown.css";

let countdown = (1708024600000  - Date.now())/1000  // Tue Dec 15 2020 17:30:00

const sleep = (millis) => {
  return new Promise((resolve, reject) => {
      setTimeout(() => {
          resolve()
      }, millis)
  })
}

let ERC20TokenContracts = {}
let autoFarmContract = null
let reloadUserWalletDataInProgress = false
let hashCompletionHandled = {}
let initialMountDone = false 

const AUTOAddress = "0x4508abb72232271e452258530d4ed799c685eccb".toLowerCase();
const AUTOv2Address = ""

class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      userAUTOBalance: "..." ,    // key = pid
      migrateAmt: 0,
      userAUTOAllowance: null,   // key = wantAddress
    };

  }


  
  getERC20TokenContract = (tokenAddress) => {
    tokenAddress = tokenAddress.toLowerCase()
    if (!ERC20TokenContracts[tokenAddress]){
        // ERC20TokenContracts[tokenAddress] = new ethers.Contract( tokenAddress, ERC20.abi, signer )
        ERC20TokenContracts[tokenAddress] = { 
          p: new this.props.web3.eth.Contract(ERC20.abi, tokenAddress, (error, result) => { if (error) console.log(error) }),
          np: new this.props.web3_np.eth.Contract(ERC20.abi, tokenAddress, (error, result) => { if (error) console.log(error) })
        }
    }
    return ERC20TokenContracts[tokenAddress]
  }

  getAutoFarmContract = (refresh) => {
    // Refresh required if change from metamask to wallet connect since privider changed.
    let autoFarmContractAddress = constants.autoFarmV2ContractAddress
    if (refresh || !autoFarmContract){
        autoFarmContract = { 
          p: new this.props.web3.eth.Contract(AutoFarm.abi, autoFarmContractAddress, (error, result) => { if (error) console.log(error) }),
          np: new this.props.web3_np.eth.Contract(AutoFarm.abi, autoFarmContractAddress, (error, result) => { if (error) console.log(error) }),
      }
    }
    return autoFarmContract
  }
  
  componentDidUpdate = (prevProps, prevState) => {
   
    //////////////////////// Checking statuses ////////////////////////
    let connectionJustBecameOK = false
    let addressIsValid = false
    let validAddressChanged = false
    // let pageChanged = false

    // if (this.props.page != prevProps.page){
    //   pageChanged = true
    // }

    if (this.props.connectionOK && !prevProps.connectionOK){
      connectionJustBecameOK = true
    }

    if (this.props.address){
      addressIsValid = true
    }
    
    if (addressIsValid && this.props.address != prevProps.address){
      validAddressChanged = true
    }



    //////////////////////// Deciding if should reload wallet data ////////////////////////
    let shouldReloadUserWalletData = false

    // If just connected, reload
    if (connectionJustBecameOK && addressIsValid){
      shouldReloadUserWalletData = true

    } else if (this.props.connectionOK && validAddressChanged){     // If address changed, reload
      shouldReloadUserWalletData = true
    } 
   
    // else if (pageChanged && addressIsValid && this.props.connectionOK ){
    //   shouldReloadUserWalletData = true
    // }


    if (shouldReloadUserWalletData ){

      try{ this.reloadUserWalletData(this.props)
      }catch(err){
        console.log(err)
      }
    
    }
  
    return true
  }

  // shouldComponentUpdate(nextProps, nextState){
  // }

  componentDidMount = () => {
    console.log(this.props, "componentDidMount()")
    this.reloadUserWalletData()
  }

  fetchUserAUTOBalance = async () => {
    
    let userAUTOBalanceNew = this.state.userAUTOBalance
    let userAUTOAllowanceNew = this.state.userAUTOAllowance

    let contract = this.getERC20TokenContract( AUTOAddress )  //"0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c")
    
    let balance = await contract.np.methods.balanceOf(this.props.address).call({}, (err, data) => { if (err) { console.log(err) } } )
    
    userAUTOBalanceNew = ethers.utils.formatUnits(balance.toString(), 18)

    let autoFarmContractAddress = constants.autoFarmV2ContractAddress 

    let allowance = await contract.np.methods.allowance(this.props.address, autoFarmContractAddress).call({}, (err, data) => { if (err) { console.log(err)} })
    userAUTOAllowanceNew = allowance.toString()
  
    await this.setState({ 
      userAUTOBalance : userAUTOBalanceNew,
      userAUTOAllowance: userAUTOAllowanceNew,
      migrateAmt: userAUTOBalanceNew,
    }, ()=>{ console.log(this.state)})

  }

 
  reloadUserWalletData = async (props, _pid) => {

    await sleep(1000)

    if (reloadUserWalletDataInProgress){
      return
    } 
    reloadUserWalletDataInProgress = true
    let startTime = Date.now()

    // Get wallet balace of all want tokens,

    await this.fetchUserAUTOBalance(props, _pid)

    reloadUserWalletDataInProgress = false
    // console.log("reloadUserWalletData() Done! Seconds taken = ", (Date.now() - startTime) / 1000 )

  }


  harvestAll = async () => {
    for (let pid in this.state.userPendingAUTO){
      let userPendingAUTO = this.state.userPendingAUTO[pid]
      if ( userPendingAUTO && parseFloat(userPendingAUTO) > 0 ) {
        this.withdraw(pid, "0")
      }
    }
  }


  migrateToAUTOv2  = async () => {
    let migrateAmt = this.state.migrateAmt
    if (isNaN(migrateAmt) || !migrateAmt || migrateAmt == '0' || parseFloat(migrateAmt) == 0){ethers.utils.parseUnits(migrateAmt, 18) 
      alert("Cannot migrate 0")
      return
    }

    let contract = this.getAutoFarmContract(true) 

    const contractMigrate = () => {
        // Deposit
        console.log(ethers.utils.parseUnits(migrateAmt, 18).toString(), "migrateToAUTOv2()")
        contract.p.methods.migrateToAUTOv2(ethers.utils.parseUnits(migrateAmt, 18) ).send({ from: this.props.address}, (err, data) => { if (err) { console.log(err) } } )
        .on('error', (error) => {  })
        .on('transactionHash', (transactionHash) => { this.props.notify("Migrating..."); console.log(transactionHash, "pending...") })
        .on('receipt', (receipt) => {
          console.log(receipt, "receipt") // contains the new contract address
          if (!hashCompletionHandled[receipt.blockHash]){
            hashCompletionHandled[receipt.blockHash] = true
            this.props.notify("Migration complete!")
            this.reloadUserWalletData()
          } 
        })
        .on('confirmation', function(confirmationNumber, receipt){ 
          // console.log(receipt, "confirmation") // contains the new contract address
        })
    }

    // Approve if allowance less than _amt
    let wantAddress = AUTOAddress
    if ( !migrateAmt 
    || BigNumber.from(ethers.utils.parseUnits( this.state.userAUTOAllowance, 18)).lt( ethers.utils.parseUnits( migrateAmt, 18)  ) ){
      
      this.props.notify("Approval required.")
      let wantTokenContract = this.getERC20TokenContract(wantAddress)
      let autoFarmContractAddress = constants.autoFarmV2ContractAddress 
      console.log(`Migrating AUTOv1${wantAddress} to V2 by interacting with AutofarmV2${autoFarmContractAddress}`)
      await wantTokenContract.p.methods.approve(autoFarmContractAddress, ethers.utils.parseUnits("5", 76) ).send({ from: this.props.address}, (err, data) => { if (err) { console.log(err) } } )
      .on('error', (error) => {  console.log(error); return  })
      .on('transactionHash', (transactionHash) => {
        this.props.notify("Approving...")
        console.log(transactionHash, "Approving...") })
      .on('receipt', (receipt) => {
        console.log("receipt") // contains the new contract address
        if (!hashCompletionHandled[receipt.blockHash]){
          hashCompletionHandled[receipt.blockHash] = true
          this.props.notify("Approval complete!")
          contractMigrate()
        }
      })
      .on('confirmation', (confirmationNumber, receipt) => { 
        // console.log(receipt, "confirmation") // contains the new contract address
      })

    } else {
      // console.log("APPROVED ALR", migrateAmt[wantAddress.toLowerCase()])
      contractMigrate()
    }

  }


  render = () => {
  
    return (
      <div style={{ marginTop:"30px", width: "100%", textAlign: "center"}}>

        <div style={{ maxWidth: "780px", margin: "auto", marginTop:"0px", 
        //transform:"translateX(-8px)"
          }}>

          <div style={{paddingTop:"58px", fontWeight:"bold"}}>
            Migrate AUTO to AUTOv2 <span style={{color:"grey", fontWeight:"normal"}}>(1:1 swap)</span>
          </div>
          <div style={{ fontSize:"13px", color:"grey"}} > <a target="_blank" href="https://autofarm-network.medium.com/"><u>learn more</u></a></div> 

          {/* 
          <div style={{paddingTop:"28px", color:"grey"}}>
                {this.state.userAUTOBalance}
          </div> */}


          <div>
            <input 
              style={{
                // webkitAppearance: "none",
                  // margin: 0;
                marginTop:"28px",
                maxWidth:"160px",
                fontSize:"0.875rem",
                width:"100%",
                color: "rgba(0, 0, 0, 0.87)",
                border: "3px solid #f2f2f2",
                outline:"none"
              }}
              value={ this.state.migrateAmt} 
              onChange={(e)=>{
                this.setState({ migrateAmt : e.target.value})
              }}

              type="number" 
            /> 
          </div>
          

          <button
            disabled={isNaN(this.state.userAUTOBalance)}
            onClick={()=>{ this.migrateToAUTOv2() }}
            style={{ 
              marginTop:"28px",
              color: "white",  display: "inline-block", alignItems: "left", borderRadius: "25px", 
              backgroundColor: isNaN(this.state.userAUTOBalance) ? "rgb(168 168 168)" : "rgb(95 95 95)" ,// 
              cursor: "pointer", whiteSpace: "nowrap", 
              // padding: "13.5px 12px 13px 12px",
              padding:"13.5px 12px 12px 12px",
              fontSize: "18px" 
            }}
          > 
                Migrate
          </button>

          
          </div>

          <div style={{paddingTop:"180px"}}></div>

      </div>
    )
  };
}

export default App
