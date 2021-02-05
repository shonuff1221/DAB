// tslint:disable:no-console

import * as React from 'react'
import BotNavBar from './BotNavBar'

import Vaults from './Vaults'
import Vaults2 from './Vaults2'
import MigrateAUTOv2 from './MigrateAUTOv2'

import Swap from './Swap'
import { ToastContainer, toast, Slide } from 'react-toastify';

import constants from './constants'

import 'react-toastify/dist/ReactToastify.css';

import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link
} from "react-router-dom";

class App extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      page: "v2_vaults",
    };

  }

  notify = (msg) => toast.dark(msg);

  
  renderMain = () => {
    let page = this.state.page
    if (page == "v1_vaults"){
      return  <div>

        <Vaults
          notify={this.notify}
          page = {page}
          connectionOK={this.props.connectionOK}
          connected={this.props.connected}
          chainId={this.props.chainId}
          address={this.props.address}
          web3={this.props.web3}
          web3_np={this.props.web3_np}
      />
      
      </div>
    }

    
    else if (page == "swap"){
      return <div>
        <Swap
            page = {page}
            connectionOK={this.props.connectionOK}
            connected={this.props.connected}
            chainId={this.props.chainId}
            address={this.props.address}
            web3={this.props.web3}
            web3_np={this.props.web3_np}
        />
      </div>
    }
    
    
    else if (page == "v2_vaults"){
        return  <div>

        <Vaults2
          v2={true}
          notify={this.notify}
          page = {page}
          connectionOK={this.props.connectionOK}
          connected={this.props.connected}
          chainId={this.props.chainId}
          address={this.props.address}
          web3={this.props.web3}
          web3_np={this.props.web3_np}
      />
      </div>
      }

      
      else if (page == "swap"){
        return <div>
          <Swap
              page = {page}
              connectionOK={this.props.connectionOK}
              connected={this.props.connected}
              chainId={this.props.chainId}
              address={this.props.address}
              web3={this.props.web3}
              web3_np={this.props.web3_np}
          />
        </div>
      }

      else if (page == "migrate"){
        return   <MigrateAUTOv2
        notify={this.notify}
        page = {page}
        connectionOK={this.props.connectionOK}
        connected={this.props.connected}
        chainId={this.props.chainId}
        address={this.props.address}
        web3={this.props.web3}
        web3_np={this.props.web3_np}
      />
      }
 

   

    

  }
  
  
  renderMenu = () => {
    let page = this.state.page

    if (page == "migrate"){ 
      return <div style={{  maxWidth: "880px", height: "100%", margin: "auto",
        alignItems: "center",
        display: "grid",
        justifyContent: "space-between",
        height:0,
        cursor:"pointer"
      }}>
          
        <div style={{height: 0, fontSize:"13px", textAlign:"left", paddingLeft:"5px", color:"grey"}} 
          onClick={()=>{this.setState({page:"v2_vaults"})}}>
          <u>back</u>
        </div> 

      </div> 

        
    }


    let button_vaults_1 = <div style={{padding:"0px 5px 0px 5px"}}>    
        <button
          onClick={()=>{ this.setState({ page : "v1_vaults" }) }}
          style={{ 
            color: "white",  display: "inline-block", alignItems: "left", borderRadius: "25px", 
            backgroundColor:  page == "v1_vaults" ? "rgb(95 95 95)" : "rgb(168 168 168)",
            cursor: "pointer", whiteSpace: "nowrap", padding: "15px 12px 12px 12px", fontSize: "18px" 
          }}
        >
          Vaults1
        </button>
      </div>

    let button_vaults_2 = <div style={{padding:"0px 5px 0px 5px"}}>    
        <button
          onClick={()=>{ this.setState({ page : "v2_vaults" }) }}
          style={{ 
            color: "white",  display: "inline-block", alignItems: "left", borderRadius: "25px", 
            backgroundColor:  page == "v2_vaults" ? "rgb(95 95 95)" : "rgb(168 168 168)",
            cursor: "pointer", whiteSpace: "nowrap", padding: "15px 12px 12px 12px", fontSize: "18px" 
          }}
        >
          Vaults
        </button>

        {page == "v2_vaults" ?
          <div style={{height: 0, paddingTop:"2px", fontSize:"13px", color:"grey"}}  > 
            <span style={{cursor:"pointer"}} onClick={()=>{this.setState({page: "v1_vaults"})}} ><u>Autofarm V1</u></span>
          </div>
          :
          ""
        }

      </div>


    let button_swap = <div style={{padding:"0px 5px 0px 5px"}}>    
            <button
              onClick={()=>{ this.setState({ page : "swap" }) }}
              style={{ 
                color: "white",  display: "inline-block", alignItems: "left", borderRadius: "25px", 
                backgroundColor:  page == "swap" ? "rgb(95 95 95)" : "rgb(168 168 168)",
                cursor: "pointer", whiteSpace: "nowrap", padding: "15px 12px 12px 12px", fontSize: "18px" 
              }}
            >
            Swap
            </button>
        </div>

        
    let text_migrate_to_v2 =       <div style={{paddingTop:"8px"}}>
      <div style={{height: 0, fontSize:"14px", color:"grey"}}  > 
        <span>Autofarm has upgraded to V2!</span> 
      </div> 

      <div style={{paddingTop:"20px", fontSize:"13px", color:"grey"}}  > 
      <span style={{cursor:"pointer"}} onClick={()=>{this.setState({page: "v2_vaults"})}} ><u> Autofarm V2</u></span>
        <span> | </span>
        <span style={{ fontSize:"13px", color:"grey"}} > <a target="_blank" href="https://autofarm-network.medium.com/"><u>learn more</u></a></span> 
        <span> | </span>
        <span style={{cursor:"pointer"}} onClick={()=>{this.setState({page: "migrate"})}} ><u>migrate AUTO</u></span>
      </div> 
    </div>

    let text_back_to_v1 =       <div style={{paddingTop:"8px"}}>
      <div style={{paddingTop:"0px", fontSize:"13px", color:"grey"}}  > 
        <span style={{cursor:"pointer"}} onClick={()=>{this.setState({page: "v1_vaults"})}} ><u>Autofarm V1</u></span>
      </div> 
    </div>

    let text_under_button = ""

    // if (page == "v2_vaults"){
    //   text_under_button = text_back_to_v1
    // } 
    if (page == "v1_vaults"){
      text_under_button = text_migrate_to_v2
    }
        
    return <div style={{textAlign:"center" }}>

        <div style={{  maxWidth: "880px", height: "100%", margin: "auto",
                  alignItems: "center",
                  display: "flex",
                  justifyContent: "space-between",
                  maxWidth: "200px",
                  paddingRight: "15px"
                }}>

                {/* {button_vaults_1} */}
                
                {button_vaults_2}

                {button_swap}

              </div>

              {/* <div style={{paddingTop:"8px"}}>
                <div style={{height: 0, fontSize:"13px", color:"grey"}}  > 
                  <span>Autofarm has just upgraded to V2!</span> 
                </div> 

                <div style={{paddingTop:"20px", fontSize:"13px", color:"grey"}}  > 
                  <span style={{ fontSize:"13px", color:"grey"}} > <a target="_blank" href="https://autofarm-network.medium.com/"><u>learn more</u></a></span> 
                  <span> | </span>
                  <span style={{cursor:"pointer"}} onClick={()=>{this.setState({page: "migrate"})}} ><u>migrate AUTO</u></span>
                </div> 
              </div> */}


              <div>
                {text_under_button}
              </div>

    </div>
  }
  

  render = () => {

    return (
      <div style={{ marginTop:"35px", width: "100%", textAlign: "center"}}>

        <div style={{ minHeight: "630px",}}>

        <ToastContainer
          transition={Slide}
          position="bottom-left"
          autoClose={3000}
          hideProgressBar
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
        />

        {this.renderMenu()}

        {this.renderMain()}
 
        {constants.mode == "prod" ? "" : <h3>Mode: {constants.mode}</h3>}

        
       </div>

        <BotNavBar/>


         
      </div>
    )
  };


}

export default App


function Home() {
  return <h2>Home</h2>;
}