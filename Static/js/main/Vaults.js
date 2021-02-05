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


let ERC20TokenContracts = {}
let autoFarmContract = null
let reloadUserWalletDataInProgress = false
let hashCompletionHandled = {}
let initialMountDone = false 


const sleep = (millis) => {
  return new Promise((resolve, reject) => {
      setTimeout(() => {
          resolve()
      }, millis)
  })
}


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
      poolsDisplayOrder: [],
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
    let autoFarmContractAddress = this.props.v2 ? constants.autoFarmV2ContractAddress : constants.autoFarmContractAddress
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
    let v2Changed = false
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

    if (addressIsValid && this.props.v2 != prevProps.v2){
      v2Changed = true
    }


    //////////////////////// Deciding if should reload wallet data ////////////////////////
    let shouldReloadUserWalletData = false

    // If just connected, reload
    if (connectionJustBecameOK && addressIsValid){
      shouldReloadUserWalletData = true

    } else if (this.props.connectionOK && validAddressChanged){     // If address changed, reload
      shouldReloadUserWalletData = true
    } 
    else if (v2Changed && addressIsValid){     // If address changed, reload
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
  //   if (this.props.page != nextProps.page){
  //     return false
  //   }
  //   return true
  // }


  componentDidMount = () => {
    console.log(this.props, "componentDidMount()")
    // console.log("VAULT componentDidMount()")
    // if (initialMountDone){ return }
    // initialMountDone = true

    let url =  constants.serverURLBase
    if (isBrowser){
      url += 'get_farms_data' 
    } else {
      url += 'get_farms_data_mobile'
    }

    axios({
          method: 'get',
          url: url, //this.props.v2 ? constants.serverURLBase2 + 'get_farms_data': constants.serverURLBase + 'get_farms_data',
          params: {}
      }).then(res=>{
          console.log(res, "get_farms_data")
          this.preprocessFarmsData(res)

          if (this.props && this.props.web3 && this.props.web3.eth){
            try{
              this.reloadUserWalletData(this.props)
            }catch(err){
              console.log(err)
            }
          }
          
          // this.props.context.context.library.getBlock('latest').then(block=> { console.log(block.number, "GETBLOCK")})

          // <button 
          //   onClick={()=>{
          //   console.log(context)
          //   // context.library.getBlock('latest').then(console.log)
          //   context.library.getSigner().sendTransaction({
          //     to: context.account,
          //     // gasLimit : "0x2a",
          //     value:  ethers.utils.parseUnits("1", 18)
          //   }).then(console.log)
      
          //   // console.log(  )
          // }}>SEND TRANSACTION</button> */}

          
      })


    axios({
        method: 'get',
        url: this.props.v2 ? constants.serverURLBase2 + 'get_stats' : constants.serverURLBase + 'get_stats',
    }).then(res=>{
        // console.log(res.data, "get_stats")
        this.setState({
          stats: res.data
        })
    })
  }

  preprocessFarmsData = (res) => {
    // let columns = res.columns
    let poolsDisplayOrder = res.data.poolsDisplayOrder
    let table_data = res.data.table_data
    let pools = res.data.pools

    for (let row = 0; row < table_data.length; row ++){
      for (let col = 0; col < table_data[row].length; col ++){
        // String -> JSX
        let pid = table_data[row][0]
        
        // if (col == 2){  // ASSET
        //   let activeIcon = <div style={{background: "green", width: "9px", height: "9px", borderRadius: "50%" }}></div> 

        //   // let activeIcon =  <Tooltip title="Active"> <button> 
        //   //   <div style={{background: "green", width: 9px", height: "10px", borderRadius: "50%" }}></div> 
        //   //   </button></Tooltip>
        //   let inactiveIcon = <div style={{background: "rgb(0 ,0 ,0, 0.2)", width: "9px", height: "9px", borderRadius: "50%" }}></div>
        //   table_data[row][col] = 
        //   <div style={{position:"relative"}}>
        //       <div style={{ margin: 0, position: "absolute", top: "50%", left: "-10px", marginRight: "-50%", transform: "translate(-50%, -50%)" }}> 
        //         {pools[pid].allowDeposits ? activeIcon : inactiveIcon}
        //       </div>
        //       <div style={{wordBreak: "break-all"}}> {table_data[row][col]} </div> 
        //   </div>
        // }

        let colFarmName = 3
        let colTVL = 4
        let colAPY = 5
        if (isBrowser){
        } else {
          colFarmName = -1;  colTVL =3; colAPY =4;
        }

        // Farm
        if (col == 1){ table_data[row][col] =  <div style={{wordBreak: "none", color:"grey", width:"5px", fontSize:"10px", transform: "translate(-239%, 1.3px)" }}> {table_data[row][col]} </div> }
            
        // if (col == 2){ table_data[row][col] =  <div style={{wordBreak: "break-all" }}> {table_data[row][col]} </div> }
        if (col == colFarmName){ table_data[row][col] =  <div style={{wordBreak: "break-all" }}> {table_data[row][col]} </div> }

        // TVL
        if (col == colTVL){ table_data[row][col] =  <div style={{wordBreak: "none", textAlign:"right", maxWidth:"75px", paddingRight:"8px"}}> {commaNumber(table_data[row][col].toFixed(0))} </div> }

        // APY
        if (col == colAPY){ 
          let apy = table_data[row][col]
          if (!isNaN(apy)){
            if (apy > 999999){
              apy = <span>{commaNumber((apy / 1e6).toFixed(1))} M </span>
            } else  if (apy > 999){
              apy = <span>{commaNumber((apy / 1e3).toFixed(1))} <b>K</b> </span>
            }
          }
          
          table_data[row][col] =  <div style={{wordBreak: "none", textAlign:"right", maxWidth:"70px"}}> { apy } </div>
        }

        
          
    
      }
    }


    this.setState({
      poolsDisplayOrder,
      table_data,
      pools
    }, () => {
      // console.log(this.state)
    })


  }

  fetchUserWantsBalances = async (props, _pid) => {
      
    // for (let pid in this.state.pools){
    for (let pid of this.state.poolsDisplayOrder){

      if (this.props.page != "v1_vaults"){return}    // If page is changed, just stop.

      if (!isNaN(_pid) && _pid != pid){continue } // If updating only a specific pid & this is not the one, skip it

      let userWantsBalancesNew = this.state.userWantsBalances
      let userWantsAllowanceNew = this.state.userWantsAllowance

      let pool = this.state.pools[pid]

      let contract = this.getERC20TokenContract( pool.wantAddress )//"0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c")
      
      let balance = await contract.np.methods.balanceOf(props.address).call({}, (err, data) => { if (err) { console.log(err) } } )
      
      // console.log(balance, "balance!!!!!!!!!!!!!!!")
      userWantsBalancesNew[pid] = ethers.utils.formatUnits(balance.toString(), pool.wantDecimals)

      let autoFarmContractAddress = this.props.v2 ? constants.autoFarmV2ContractAddress : constants.autoFarmContractAddress

      let allowance = await contract.np.methods.allowance(props.address, autoFarmContractAddress).call({}, (err, data) => { if (err) { console.log(err)} })
      userWantsAllowanceNew[pool.wantAddress.toLowerCase()] = allowance.toString()
    
      await this.setState({ 
        userWantsBalances : userWantsBalancesNew,
        userWantsAllowance: userWantsAllowanceNew
      })

    } 

  }

  fetchUserPendingAUTO = async (props, _pid) => {
 
    const calcAndSetTotalPendingAUTO = () => {
      let totalPendingAUTO = "0"
      for (let pid in this.state.pools){
        let userPendingAUTOPid = ethers.utils.parseUnits(this.state.userPendingAUTO[pid], 18) 
        totalPendingAUTO = BigNumber.from(totalPendingAUTO).add(userPendingAUTOPid)
      }
      if (this.state.totalPendingAUTO != totalPendingAUTO){
        this.setState({ totalPendingAUTO : ethers.utils.formatUnits(totalPendingAUTO, 18) }, () => {})
      }
    }

    let userPendingAUTONew = this.state.userPendingAUTO
    
    // for (let pid in this.state.pools){
    for (let pid of this.state.poolsDisplayOrder){
      if (this.props.page != "v1_vaults"){return}    // If page is changed, just stop.

      if (!isNaN(_pid) && _pid != pid){ continue } // If updating only a specific pid & this is not the one, skip it
      
        let userWantsAllowanceNew = this.state.userWantsAllowance

        let contract = this.getAutoFarmContract() 
        let pendingAUTO = await contract.np.methods.pendingAUTO(pid, props.address ).call({}, (err, data) => { if (err) { console.log(err) } } )
        userPendingAUTONew[pid] = ethers.utils.formatUnits(pendingAUTO.toString(), 18)
        if (parseInt(userPendingAUTONew[pid]) > 90000){ userPendingAUTONew[pid] = "0" }
        await this.setState({userPendingAUTO: userPendingAUTONew}, ()=>{
    
      })

    
    } 

    calcAndSetTotalPendingAUTO()

  
  }

  fetchUserStakedWantTokens = async (props, _pid) => {
    
    // for (let pid in this.state.pools){
    for (let pid of this.state.poolsDisplayOrder){
      if (this.props.page != "v1_vaults"){return}    // If page is changed, just stop.

      if (!isNaN(_pid) && _pid != pid){ continue } // If updating only a specific pid & this is not the one, skip it

      let userStakedWantTokensNew = this.state.userStakedWantTokens

      let contract = this.getAutoFarmContract()
      let stakedWant = await contract.np.methods.stakedWantTokens(pid, props.address ).call({}, (err, data) => { if (err) { console.log(err) } } ) 
      userStakedWantTokensNew[pid] = ethers.utils.formatUnits(stakedWant.toString(), this.state.pools[pid].wantDecimals)

      await this.setState({userStakedWantTokens : userStakedWantTokensNew})
    } 

  }

  reloadUserWalletData = async (props, _pid) => {
    
    await sleep(1000)

    if (reloadUserWalletDataInProgress){ return } 

    reloadUserWalletDataInProgress = true
    let startTime = Date.now()
    
    // Get wallet balace of all want tokens,

    await this.fetchUserWantsBalances(props, _pid)

    await this.fetchUserPendingAUTO(props, _pid)

    await this.fetchUserStakedWantTokens(props, _pid)

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


  deposit  = async (_pid, _amt) => {
    // if (_amt == '0' || parseFloat(_amt) == 0){
    //   alert("Cannot deposit 0")
    //   return
    // }
    // console.log( _pid, _amt, "handleDepositClicked")
    let contract = this.getAutoFarmContract(true) 

    const contractDeposit = (_pid) => {
        // Deposit
        contract.p.methods.deposit(_pid, ethers.utils.parseUnits(_amt, 18) ).send({ from: this.props.address}, (err, data) => { if (err) { console.log(err) } } )
        .on('error', (error) => {  })
        .on('transactionHash', (transactionHash) => { this.props.notify("Deposit pending..."); console.log(transactionHash, "pending...") })
        .on('receipt', (receipt) => {
          console.log(receipt, "receipt") // contains the new contract address
          if (!hashCompletionHandled[receipt.blockHash]){
            hashCompletionHandled[receipt.blockHash] = true
            this.props.notify("Deposit complete!")
            this.reloadUserWalletData(this.props, _pid)
          } 
        })
        .on('confirmation', function(confirmationNumber, receipt){ 
          // console.log(receipt, "confirmation") // contains the new contract address
        
        })
    }

    // Approve if allowance less than _amt
    let wantAddress = this.state.pools[_pid].wantAddress
    if ( !this.state.userWantsAllowance[wantAddress.toLowerCase()] 
    || BigNumber.from(this.state.userWantsAllowance[wantAddress.toLowerCase()]).lt(ethers.utils.parseUnits(_amt, 18))  ){
      // console.log("NEED TO APPROVE")
      
      this.props.notify("Approval required.")
      let wantTokenContract = this.getERC20TokenContract(wantAddress)
      let autoFarmContractAddress = this.props.v2 ? constants.autoFarmV2ContractAddress : constants.autoFarmContractAddress
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
          contractDeposit(_pid)
        } 
      })
      .on('confirmation', (confirmationNumber, receipt) => { 
        // console.log(receipt, "confirmation") // contains the new contract address
      })

    } else {
      // console.log("APPROVED ALR", this.state.userWantsAllowance[wantAddress.toLowerCase()])
      contractDeposit(_pid)
    }

    


  }


  withdraw = async (_pid, _amt) =>{

    let contract = this.getAutoFarmContract(true) 

    // Withdraw
    let withdrawTransaction = await contract.p.methods.withdraw(_pid, ethers.utils.parseUnits(_amt, 18) ).send({ from: this.props.address}, (err, data) => { if (err) { console.log(err) } } )
    .on('error', function(error){  })
    .on('transactionHash', (transactionHash) => {         this.props.notify("Withdraw pending...");    console.log(transactionHash, "pending...") })
    .on('receipt', (receipt) => {
      console.log(receipt, "receipt") // contains the new contract address
      if (!hashCompletionHandled[receipt.blockHash]){
        hashCompletionHandled[receipt.blockHash] = true
        this.props.notify("Withdraw complete!")
        this.reloadUserWalletData(this.props, _pid)
      } 
    })
    .on('confirmation', (confirmationNumber, receipt) => { 
      // console.log(confirmationNumber, "confirmation") // contains the new contract address
    })
  
  }




  renderCountdown = () => {
    return <div style={{padding:"15px 0px 23px 0px", display: countdown <= 0 ? "none": "" }}>
            <div style={{fontWeight:"bold"}}>
              Start earning AUTO in..
            </div>
        
            <div style={{display:"inline-block"}}>
              <CountdownTimer  count={  countdown } className= "countdown" showTitle  style={{
                textAlign:"center"
              }} />
            </div>

            
            <div style={{fontSize:"13px", color:"grey"}}>
              Above countdown is estimated. Click <a target="_blank" href={"https://bscscan.com/block/countdown/3115638"}  style={{ textDecoration: "none", color: "inherit", paddingLeft:"3px" }}><u>here</u></a> for accurate countdown.
            </div>

            <div style={{fontSize:"13px", color:"grey"}}>
              Vaults are already operational.
            </div>
        </div>


  }

  renderDashboard = () => {

    return <div style={{marginTop:"38px"}}>
            {/* <div style={{ fontSize: 30, letterSpacing: "2px", fontWeight: "bold" }}> 
              <span> vaults </span> 
            </div> */}

        <Grid container spacing={0} style={{}}>
            <Grid item xs={1} sm={2}>
                {/* Left */}
            </Grid>
            <Grid item xs={5} sm={4}>

              


              <div><b>TVL</b></div>
              <div> { !isNaN(this.state.stats.platformTVL) ? "$" + commaNumber(this.state.stats.platformTVL.toFixed(0)) : "..."} </div>
             {/* <Button variant="contained" style={{padding:"5px"}}> Harvest All </Button> */}

            </Grid>
            <Grid item xs={5} sm={4}>

              <div><b>Pending AUTO</b></div>

              <div> 
                {this.state.totalPendingAUTO ? commaNumber(parseFloat(this.state.totalPendingAUTO).toFixed(4)) : "0"} 
                <button                
                    disabled={  !this.state.totalPendingAUTO ||  parseFloat(this.state.totalPendingAUTO) == 0  ? true : false }
                    onClick={()=>{ this.harvestAll() }} style={{fontSize:"12px", border:"none", marginLeft:"5px"}}
                  >Harvest All</button>
                </div>
            </Grid>
            <Grid item xs={1} sm={2}>
                {/* Left */}
            </Grid>
        </Grid>

    
    </div>
  }
  // async deposit(){
  //     console.log('DEPOSIT')
  //     console.log(this.props, 'PROPS')

  //     let block = await this.props.web3.eth.getBlock('latest')
  //     console.log(block)
 
  //     // let contract_pair = new this.props.web3.eth.Contract(uniswap_pair_abi, pair, (error, result) => { if (error) console.log(error) })


  // }


  renderNotes = (pid) => {
    let notes = [    
      <div> <b>Notes</b> </div>
    ]

    for (let i in this.state.pools[pid].notes){
      let note = <div> {this.state.pools[pid].notes[i]}</div>
      notes.push(note)
    }
                            
    return  <div style={{ textAlign:"left", paddingBottom:"5px", display: this.state.pools[pid].notes && this.state.pools[pid].notes[0] ? "" : "none"  }}>
      {notes}
    </div>
               
  }

  tableOptions = {
    customToolbar: () => {
      return <div style={{transform:"translateY(15px)"}}>
      
      {/* <DepositWithdrawToggle handleToggle = {(selected)=>{
        if (selected == "deposit"){ this.setState({withdraw : false })}
        if (selected == "withdraw"){ this.setState({withdraw : true })}
      }}/> */}

            <Tooltip title="Withdraw Menu"> 
              <IconButton
                onClick={()=>{ if (!this.state.withdraw){ this.setState({withdraw: true }) } }}
                style={{width:"auto",padding: "0px", marginLeft:"3px" , border: "solid", borderRadius: "5px", borderColor: this.state.withdraw ? "" : "white"}}
              >
                <Remove/>
              </IconButton>
            </Tooltip>

            <Tooltip title="Deposit Menu"> 
              <IconButton 
                onClick={()=>{ if (this.state.withdraw){ this.setState({withdraw: false }) } }}
                style={{width:"auto",padding: "0px", marginLeft:"3px" , border: "solid", borderRadius: "5px", borderColor: this.state.withdraw ? "white" : ""
              }}
              >
                <Add/>
              </IconButton>
            </Tooltip>


      </div>
    },
    
    responsive: "standard", // stacked or scroll
    rowsPerPageOptions: [20, 50, 100],
    rowsPerPage: 20,  // Should be one of above
    filterType: 'checkbox',
    sort: false,
    pagination: false,
    print: false,
    download: false,
    filter: false,
    selectableRows: false, // show checkboxes
    search : false,
    caseSensitive: false, //caseSensitivity does not work well - cannot find all letters in CAPs :(
      viewColumns: false,
      expandableRows: true,
          renderExpandableRow: (rowData, rowMeta) => {
            let pid = rowData[0]
            let userPendingAUTO = this.state.userPendingAUTO[pid]
            return (
              <tr style={{ rowspan: "3", width: "100%" }}>                
                <td colSpan="100%" style={{padding:"5px 5px 5px 15px", letterSpacing:"0px", fontSize:"12px"}}> 
                  
                  {
                     this.state.pools && this.state.pools[pid] && this.state.pools[pid].startEarningFrom &&  new Date(this.state.pools[pid].startEarningFrom).getTime() > Date.now() ?
                     
                     <div style={{marginTop:"10px", fontSize:"13px"}}> 
                       {this.state.pools[pid].startEarningFromMsg} 
                       <DateCountdown 
                          mostSignificantFigure="hour" locales= {['yr','mth','d','h','m','s']} locales_plural= {['yr','mth','d','h','m','s']} 
                          // dateTo={"19 Dec 2020 16:05:30 GMT"}
                          dateTo= {this.state.pools[pid].startEarningFrom} // "18 Dec 2020 19:09:00 GMT" // 'December 19, 2020 00:00:00 GMT+03:00' // {1608490801000}
                          // callback={()=>alert('Hello')}  
                        />   
                      </div>
                         :
                         ""
                     }


                <div style={{padding:"10px"}}><b>Pending AUTO: </b> {userPendingAUTO ?  commaNumber(parseFloat(userPendingAUTO).toFixed(4))  : 0 }  
                  <button 
                    disabled={  !userPendingAUTO ||  parseFloat(userPendingAUTO) == 0  ? true : false }
                    onClick={()=>{ this.withdraw(pid, "0") }} style={{border:"none", marginLeft:"5px"}}
                  >Harvest</button>
                </div>

                <Grid container spacing={0}>
                
                  <Grid item sm={6} xs={12}>
                      <div style={{ textAlign:"left", paddingBottom:"5px"}}>
                        
                        <div> <b>Vault Details</b></div>
                        <div>Asset:
                          <a target="_blank" href={this.state.pools[pid].wantLink}  style={{ textDecoration: "none", color: "inherit", paddingLeft:"3px" }}>  
                            <u>{this.state.pools[pid].wantName}</u>
                          </a> 
                        </div>
                       
                        <div>AUTO multiplier:  { (this.state.pools[pid].poolInfo.allocPoint / 100).toFixed(1) }x </div>
                        <div>Type:  { this.state.pools[pid].stratType ? this.state.pools[pid].stratType : "auto-compounding" } </div>


                          <div>Farm contract: 
                            <a target="_blank" href={ constants.blockExplorerURLBase + "address/" + this.state.pools[pid].farmContractAddress} style={{ textDecoration: "none", color: "inherit" }}> 
                              {/* {this.state.pools[pid].farmContractAddress}  */} <u>view</u>
                            </a>                    
                          </div>

                          <div>Vault contract: 
                            <a target="_blank" href={ constants.blockExplorerURLBase + "address/" + this.state.pools[pid].poolInfo.strat} style={{ textDecoration: "none", color: "inherit" }}> 
                              {/* {this.state.pools[pid].poolInfo.strat} */}  <u>view</u>
                            </a>                    
                          </div>
                          
                      </div>
                  </Grid>
                  <Grid item  sm={6} xs={12}>
                        <div style={{ textAlign:"left", paddingBottom:"5px"}}>
                            <div> <b>APY Calculations</b> </div>
                            <div> Farm APR: {!isNaN(this.state.pools[pid].APR) ? (this.state.pools[pid].APR * 100 ).toFixed(1) + "%": "TBD" }
                              <span style={{color:"grey", display:!isNaN(this.state.pools[pid].APR) ? "" : "none" }}> ({(this.state.pools[pid].APR * 100 / 364 ).toFixed(2)}% daily)</span> 
                            </div>
                            <div> Optimal compounds per year: {!isNaN(this.state.pools[pid].compoundsPerYear) ? this.state.pools[pid].compoundsPerYear: "TBD"} </div>
                            <div> Farm APY: {!isNaN(this.state.pools[pid].APY) ? (this.state.pools[pid].APY * 100 ).toFixed(1)  + "%": "TBD"}  </div>
                            <div> AUTO APR: {!isNaN(this.state.pools[pid].APR_AUTO) ? (this.state.pools[pid].APR_AUTO * 100 ).toFixed(1)  + "%": "TBD"} 
                              <span style={{color:"grey", display:!isNaN(this.state.pools[pid].APR_AUTO) ? "" : "none" }}> ({(this.state.pools[pid].APR_AUTO * 100 / 364 ).toFixed(2)}% daily)</span> 
                            </div>

                            <div> Total APY: {!isNaN(this.state.pools[pid].APY_total) ? (this.state.pools[pid].APY_total * 100 ).toFixed(1)  + "%": "TBD"} </div>
                        </div>
                  </Grid>
                  <Grid item  sm={6} xs={12}>
                        <div style={{ textAlign:"left", paddingBottom:"5px"}}>
                            <div> <b>Fees</b> </div>
                            <div> Controller fee: {this.state.pools[pid].controllerFeeText}</div>
                            <div> Max entrance fee: {this.state.pools[pid].entranceFeeText} </div>
                            <div> Withdrawal fee: none </div>
                        </div>
                  </Grid>
                  <Grid item  sm={6} xs={12}>
                      {this.renderNotes(pid)}
                  </Grid>

              </Grid>
                        
               
                  {/* <div style={{padding:"2px"}}>more details coming soon...</div> */}
                </td>
              </tr>
            )
          },
  // renderExpandableRow: (rowData, rowMeta) => {
          //   return (
          //     <tr style={{ rowspan: "3", width: "100%" }}>
          //       <td  colspan="100%" >testing testing test test test testing test test test testing </td>
          //     </tr>
          //   )
          // },
  };
  

  getMuiTheme = () => {
    return createMuiTheme({
      overrides: {
        MuiPaper: {
          elevation4: {
            boxShadow:"none"
            // boxShadow: "0px 1px 1px 0px rgba(0, 0, 0, 0.1), 0px 0px 0px 0px rgba(0, 0, 0, 0.1), 0px 0px 1px 0px rgba(0, 0, 0, 0.1)" //Reduce the perceived elevation
          },
        },

        MUIDataTableHeadRow: {
          //Change table header CSS
          root: {
            "&>th": {
              // width: '10rem',
              padding:"3px 2px 3px 3px"
            },
            // "&>th:nth-child(2)": { //first column
            //   paddingLeft: "25px" //padding before first column for non-checkboxed tables
            // },
            // "&>th:nth-child(1)": { //first column
            //   backgroundColor: "yellow",
            //   display: "none"
            // },
          }
        },

        MUIDataTableBodyCell: {
          //CSS of all cells
          root: {
            padding: "3px 1px 3px 1px",
          }
        },

        MUIDataTableToolbar: {
          actions:{
            textAlign: "right !important"
          }
        },

        MUIDataTable : {
          responsiveBase:{
            zIndex:0
          }
        }

      }
    });
  }


  render = () => {
    let columns = [
      { name: "pid", label: "pid", options: { filter: false, sort: false, display: false} },
      { name: "", label: "", options: { filter: false, sort: false, } },
      { name: "asset", label: "Asset", options: { filter: false, sort: true, } } 
    ]
    if(isBrowser){ 
      columns = columns.concat( [{ name: "farm", label: "Farm", options: { filter: true, sort: true, } } ] )
    }
    columns = columns.concat([
      { name: "TVL", label: "TVL $", options: { filter: false, sort: true, } },
      { name: "APY", label: "APY %", options: { filter: false, sort: true, } },
      { name: "", label:  "" , options: { sort:false, filter: true, 
        customHeadLabelRender: (columnMeta ) => {
          return this.state.withdraw ? "Deposited" : "Balance"
        },
        customBodyRender: (value, tableMeta, updateValue)=>{ 
        // customBodyRenderLite: (dataIndex)=>{ 
          let pid = -1
          if (!isNaN(tableMeta && tableMeta.rowData && tableMeta.rowData[0])){
            pid = tableMeta.rowData[0]
          }
          
          return  <DepositWithdrawButtons 
            pid={pid}
            // networkSupported = {this.props.context.networkSupported}
            allowDeposits={this.state.pools[pid].allowDeposits}
            userWantsBalances={this.state.userWantsBalances} 
            userPendingAUTO={this.state.userPendingAUTO}
            userStakedWantTokens = {this.state.userStakedWantTokens}
            withdraw = {this.state.withdraw} 
            handleDepositClicked={ this.deposit }
            handleWithdrawClicked={ this.withdraw }
          />

        } } },
    ])


    return (
      <div style={{ marginTop:"30px", width: "100%", textAlign: "center"}}>

        {/* {this.renderCountdown()} */}
        {this.renderDashboard()}

        <div style={{ maxWidth: "780px", margin: "auto", marginTop:"0px",
         transform:"translateX(-8px)"
          }}>


{/* 
          <div style={{ fontSize: 30, letterSpacing: "2px", fontWeight: "bold", height: 0, transform: "translateY(10px)" }}> 
            <span> vaults </span> 
          </div> */}

          {/* <div style={{height: 0, transform: "translateY(20px)", color:"grey", fontSize:"12px", marginTop:"5px"}}>
              Auto-compound assets, earn AUTO tokens
            </div> */}

          <div>
                <MuiThemeProvider theme={this.getMuiTheme()}>

                  <MUIDataTable 
                    // title={"Employee List"} 
                    data={this.state.table_data} 
                    columns={columns} 
                    options={this.tableOptions} 
                  />

                </MuiThemeProvider>

          </div>

          <div style={{color:"grey", fontSize:"13px", marginTop:"6px", marginBottom:"20px"}}>
            Auto-compound assets. Earn AUTO.
          </div>
          
          </div>

          <div style={{paddingTop:"180px"}}></div>

          {/* <BotNavBar/> */}

      </div>
    )
  };
}

export default App
