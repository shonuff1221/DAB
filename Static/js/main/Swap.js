// tslint:disable:no-console

import * as React from 'react'
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

import CountdownTimer from "react-component-countdown-timer";
import "./Countdown.css";
let countdown = (1708024600000  - Date.now())/1000  // Tue Dec 15 2020 17:30:00

let ERC20TokenContracts = {}
let autoFarmContract = null
let reloadUserWalletDataInProgress = false
let hashCompletionHandled = {}

class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {

      userWantsBalances:{} ,    // key = pid
      userPendingAUTO:{},     // key = pid
      userStakedWantTokens :{}, // key = pid

      userWantsAllowance: {},   // key = wantAddress

      // data: [],
      stats: {},
      pools: {},
      table_data: [],
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
    if (refresh || !autoFarmContract){
        autoFarmContract = { 
          p: new this.props.web3.eth.Contract(AutoFarm.abi, constants.autoFarmContractAddress, (error, result) => { if (error) console.log(error) }),
          np: new this.props.web3_np.eth.Contract(AutoFarm.abi, constants.autoFarmContractAddress, (error, result) => { if (error) console.log(error) }),
      }
    }
    return autoFarmContract
  }
  



  componentDidUpdate = (prevProps, prevState) => {
   
    //////////////////////// Checking statuses ////////////////////////
    let connectionJustBecameOK = false
    let addressIsValid = false
    let validAddressChanged = false

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


    if (shouldReloadUserWalletData){
      this.reloadUserWalletData(this.props)
    }
  
    return true
  }


  componentDidMount = () => {

  }

  preprocessFarmsData = (res) => {
    // let columns = res.columns
    let table_data = res.data.table_data
    let pools = res.data.pools


    for (let row = 0; row < table_data.length; row ++){
      for (let col = 0; col < table_data[row].length; col ++){
        // String -> JSX
        let pid = table_data[row][0]
        
        if (col == 1){  // ASSET
          let activeIcon = <div style={{background: "green", width: "9px", height: "9px", borderRadius: "50%" }}></div> 

          // let activeIcon =  <Tooltip title="Active"> <button> 
          //   <div style={{background: "green", width: 9px", height: "10px", borderRadius: "50%" }}></div> 
          //   </button></Tooltip>
          let inactiveIcon = <div style={{background: "rgb(0 ,0 ,0, 0.2)", width: "9px", height: "9px", borderRadius: "50%" }}></div>
          table_data[row][col] = 
          <div style={{position:"relative"}}>
              <div style={{ margin: 0, position: "absolute", top: "50%", left: "-10px", marginRight: "-50%", transform: "translate(-50%, -50%)" }}> 
                {pools[pid].earning ? activeIcon : inactiveIcon}
              </div>
              <div style={{wordBreak: "break-all"}}> {table_data[row][col]} </div> 
          </div>
        }

        // Farm
        if (col == 2){ table_data[row][col] =  <div style={{wordBreak: "break-all"}}> {table_data[row][col]} </div> }
        
        // APY
        if (col == 3){ table_data[row][col] =  <div style={{wordBreak: "none"}}> {commaNumber(table_data[row][col].toFixed(2))} </div> }

      }
    }


    this.setState({
      table_data,
      pools
    }, () => {
      // console.log(this.state)
    })


  }




  render = () => {
   
    return (
      <div style={{ marginTop:"30px", width: "100%", textAlign: "center"}}>


        <div style={{ maxWidth: "780px", margin: "auto", marginTop:"5px" }}>

{/* 
          <div style={{ fontSize: 30, letterSpacing: "2px", fontWeight: "bold"  }}> 
            <span> swap </span> 
          </div> */}

          <div style={{color:"grey", marginTop:"58px"}}>
            <div> BSC's best DEX aggregator. </div>
            <div> Coming soon. </div>
           
          </div>

          {/* <div style={{color:"grey", fontSize:"13px", marginTop:"20px"}}>
            Coming soon.
          </div> */}
     
          </div>


      </div>
    )
  };
}

export default App
