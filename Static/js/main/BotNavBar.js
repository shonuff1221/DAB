import React, { Component } from 'react';
import constants from './constants'

class BotNavBar extends Component {
  constructor(props) {
    super(props);
    this.state = {
    };
  }

  

  render() {


    return (
      <div style={{ backgroundColor:"black",}} >
            <div style={{ height: "40px", width: "100%", paddingTop:"10px"}}>
                <div style={{  maxWidth: "880px", height: "100%", margin: "auto",
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                }}>
                        <div style={{ color:"white", backgroundColor :"", width: "100%", display:"flex", alignItems:"center", alignItems: "center",  justifyContent: "space-between",}}>                            
                            <div style={{padding:"5px"}}>  </div>

                            {/* <div style={{padding:"5px"}}> <a target="_blank" href={ "https://autofarm.network/audit_anchainai.pdf" } style={{ textDecoration: "none", color: "inherit" }}> Audit </a>  </div> */}
                            <div style={{padding:"5px"}}> <a target="_blank" href={ "https://autofarm.network/audit_vidar_autofarm_v2.pdf" } style={{ textDecoration: "none", color: "inherit" }}> Audit </a>  </div>
                            
                            <div style={{padding:"5px"}}> <a target="_blank" href={ "https://github.com/autofarm-network/autofarmV2" } style={{ textDecoration: "none", color: "inherit" }}> Github </a>    </div>
                            <div style={{padding:"5px"}}>  <a target="_blank" href={ constants.blockExplorerURLBase + "address/" + constants.autoFarmV2ContractAddress} style={{ textDecoration: "none", color: "inherit" }}> Contract </a> </div>
                            <div style={{padding:"5px"}}>   <a target="_blank" href={ "https://autofarm-network.gitbook.io/autofarm-network/" } style={{ textDecoration: "none", color: "inherit" }}> Wiki </a>  </div>
                            <div style={{padding:"5px"}}>  </div>
                        
                        </div>
                </div>
            </div>

            <div style={{  height: "40px", width: "100%", paddingBottom:"10px"}}>
                <div style={{  maxWidth: "880px", height: "100%", margin: "auto",
                    alignItems: "center",
                    display: "flex",
                    justifyContent: "space-between",
                    width: "100%",
                }}>
                  <div style={{ color:"white",  width: "100%", display:"flex", alignItems:"center", alignItems: "center",  justifyContent: "space-between",}}>                            
                      <div style={{padding:"5px"}}>  </div>
                      <div style={{padding:"5px"}}>  </div>
                      <div style={{padding:"5px"}}> <a target="_blank" href={ "https://t.me/autofarm_network" } style={{ textDecoration: "none", color: "inherit" }}> Telegram </a>  </div>
                      <div style={{padding:"5px"}}> <a target="_blank" href={ "https://autofarm-network.medium.com/" } style={{ textDecoration: "none", color: "inherit" }}> Medium </a>  </div>
                      <div style={{padding:"5px"}}> <a target="_blank" href={ "https://twitter.com/autofarmnetwork" } style={{ textDecoration: "none", color: "inherit" }}> Twitter </a>   </div>
                      <div style={{padding:"5px"}}>  </div>
                      <div style={{padding:"5px"}}>  </div>
                  </div>
                </div>

            </div>
       
        </div>
          


    );
  }
}



export default BotNavBar;