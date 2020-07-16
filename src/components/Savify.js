import React, { Component } from "react";
import Web3 from "web3";
import Authereum from "authereum";
import Modal from "react-bootstrap/Modal";
import Web3Modal from "web3modal";
import "bootstrap/dist/css/bootstrap.min.css";
//import "./savify.css";
import "./smart-bots-frontend/assets/css/loader.css";
import "./smart-bots-frontend/assets/css/plugins.css";
import "./smart-bots-frontend/bootstrap/css/bootstrap.min.css";
import "./smart-bots-frontend/assets/css/structure.css";
import "./smart-bots-frontend/plugins/apex/apexcharts.css";
import "./smart-bots-frontend/assets/css/widgets/modules-widgets.css";
import savifycopy from './images/savify copy.png';
import axios from 'axios';
import dashboard from "./images/download.png";


import {
    genericDSAtoggle,
    genericDSAdeposit,
    genericDSAwithdraw
  } from "../DSA/utils";
  import {
    genericResolver,
    getBalances
  } from "../DSA/resolvers";

const DSA = require("dsa-sdk");

class App extends Component {
    constructor(props) {
        super(props);
        this.onChangeprotocol = this.onChangeprotocol.bind(this);
        this.onChangetransaction = this.onChangetransaction.bind(this);
        this.onChangeselectedAsset = this.onChangeselectedAsset.bind(this);
        this.onChangeToggleSelectedAsset = this.onChangeToggleSelectedAsset.bind(this);
        this.onChangeAmount = this.onChangeAmount.bind(this);
        this.createAccount = this.createAccount.bind(this);
        this.deposit = this.deposit.bind(this);
        this.withdraw = this.withdraw.bind(this);
        this.state = {
            buttonText: "Connect",
            buttonDisabled: true,
            shortnerAddress: "",
            errMessage: "",
            interestRate: {
                dai: {
                    compound: 0,
                    aave: 0,
                    dydx: 0,
                },
                eth: {
                    compound: 0,
                    aave: 0,
                    dydx: 0,
                },
                usdc: {
                    compound: 0,
                    aave: 0,
                    dydx: 0,
                },
            },
            protocolassetPresent: {
                dai: "",
                eth: "",
                usdc: ""
            },
            protocolinterestmax: {
                dai: "",
                eth: "",
                usdc: ""
            },
            totalSupply : {
                dai: 0,
                eth: 0,
                usdc: 0,
            },
            principalAmount: {
                dai: 0,
                eth: 0,
                usdc: 0,
            },
            transaction: [{}],
            dsa_id: 0,
            assetSelected: "eth",
            toggleassetSelected: "eth",
            amount: 0,
            
        };
        this.login();
      
    }
  
    async componentWillMount() {
        
    }

    login = async () => {
        try {
            await this.loadWeb3();
            await this.loadBlockchainData();
        } catch (err) {
            this.setState({ buttonText: "Try Again", errMessage: "Please select Mainnet in your wallet" });
            //this.showErrorModal();   
        }
    };

    async loadWeb3() {
        const providerOptions = {
            /* See Provider Options Section */
            authereum: {
                package: Authereum, // required
            },
        };
        const web3Modal = new Web3Modal({
            network: "mainnet", // optional
            cacheProvider: false, // optional
            providerOptions, // required
        });
        const provider = await web3Modal.connect();
        const web3 = new Web3(provider);
        this.setState({ web3 });
    }
  
    async showShortner() {
        let address = this.state.dsaAddress.toString()
        address = address.substring(0,6)+ '......'+ address.substring(address.length -7, address.length -1)
        this.setState({shortnerAddress : address})
    }
  
    async loadBlockchainData() {
        // in browser with react
        const accounts = await this.state.web3.eth.getAccounts();
        this.setState({ account: accounts[0] });
        const dsa = new DSA(this.state.web3);
        this.setState({ dsa });
  
        // Getting Your DSA Address
        var existingDSAAddress = await dsa.getAccounts(this.state.account);
        if (existingDSAAddress.length === 0) {
            // var newDsaAddress = await dsa.build({
            //     gasPrice: this.state.web3.utils.toWei("27", "gwei"),
            // });
            this.setState({
                buttonDisabled: false,
                buttonText: "Create Account"
            })
        }
        else{
            existingDSAAddress = await dsa.getAccounts(this.state.account);
            this.setState({ 
                dsaAddress: existingDSAAddress[0].address, 
                dsa_id: existingDSAAddress[0].id,
                buttonDisabled: true
            });
            // Setting DSA Instance
            await dsa.setInstance(existingDSAAddress[0].id);
            await this.createUserdata(dsa);
            await this.dashboardupdate(dsa); 
            await this.showShortner()
            this.setState({ buttonText: this.state.shortnerAddress});
        }
        // change to this.state.account does this requires address as string?
          
    }
    async createAccount(){
        var newDsaAddress = await this.state.dsa.build({
            gasPrice: this.state.web3.utils.toWei("27", "gwei"),
        });
        await this.loadBlockchainData();
        await this.showShortner()
        this.setState({ buttonText: this.state.shortnerAddress});
    }

    async dashboardupdate(dsa){
        await this.getUserdata(dsa);
        await this.showInterestModal(dsa);
        await this.getAssetsPresentIn(dsa);
    }

    async showInterestModal(dsa){
        const com = await dsa.compound.getPosition(this.state.dsaAddress);
        const aav = await dsa.aave.getPosition(this.state.dsaAddress);
        const dd = await dsa.dydx.getPosition(this.state.dsaAddress);
        this.setState({
            interestRate: {
                dai: {
                    compound: com["dai"].supplyYield,
                    aave: aav["dai"].supplyYield,
                    dydx: dd["dai"].supplyYield
                },
                eth: {
                    compound: com["eth"].supplyYield,
                    aave: aav["eth"].supplyYield,
                    dydx: dd["eth"].supplyYield
                },
                usdc: {
                    compound: com["usdc"].supplyYield,
                    aave: aav["usdc"].supplyYield,
                    dydx: dd["usdc"].supplyYield
                }
            }
        });
        var dai;
        var eth;
        var usdc;
        
        if(this.state.interestRate.dai.compound >= this.state.interestRate.dai.aave && this.state.interestRate.dai.compound >= this.state.interestRate.dai.dydx){
            dai = "compound";
        } else if(this.state.interestRate.dai.aave >= this.state.interestRate.dai.compound && this.state.interestRate.dai.aave >= this.state.interestRate.dai.dydx){
            dai = "aave";
        } else if(this.state.interestRate.dai.dydx >= this.state.interestRate.dai.aave && this.state.interestRate.dai.dydx >= this.state.interestRate.dai.compound){
            dai = "dydx";
        }

        if(this.state.interestRate.eth.compound >= this.state.interestRate.eth.aave && this.state.interestRate.eth.compound >= this.state.interestRate.eth.dydx){
            eth = "compound";
        } else if(this.state.interestRate.eth.aave >= this.state.interestRate.eth.compound && this.state.interestRate.eth.aave >= this.state.interestRate.eth.dydx){
            eth = "aave";
        } else if(this.state.interestRate.eth.dydx >= this.state.interestRate.eth.aave && this.state.interestRate.eth.dydx >= this.state.interestRate.eth.compound){
            eth = "dydx";
        }

        if(this.state.interestRate.usdc.compound >= this.state.interestRate.usdc.aave && this.state.interestRate.usdc.compound >= this.state.interestRate.usdc.dydx){
            usdc = "compound";
        } else if(this.state.interestRate.usdc.aave >= this.state.interestRate.usdc.compound && this.state.interestRate.usdc.aave >= this.state.interestRate.usdc.dydx){
            usdc = "aave";
        } else if(this.state.interestRate.usdc.dydx >= this.state.interestRate.usdc.aave && this.state.interestRate.usdc.dydx >= this.state.interestRate.usdc.compound){
            usdc = "dydx";
        }
        this.setState({
            protocolinterestmax:{
                dai: dai,
                eth: eth,
                usdc: usdc
            }
        })

    }

    async createUserdata (dsa){
        const user = {
            id: this.state.dsa_id
        }
        axios.post('http://localhost:1423/users/add', user)
            .then(res => console.log(res.data))
            .catch((error) => {console.log("User already created");})
    }

    async getUserdata(dsa){
        const id = this.state.dsa_id;
        axios.get('http://localhost:1423/users/'+id)
            .then(res => {
                this.setState({
                    principalAmount : {
                        dai: res.data.Dai,
                        eth: res.data.Eth,
                        usdc: res.data.USDC
                    },
                    transaction: res.data.trans
                })
            })
            .catch((error) => {console.log(error);})
    };

    async getAssetsPresentIn(dsa){
        const com = await dsa.compound.getPosition(this.state.dsaAddress);
        const aav = await dsa.aave.getPosition(this.state.dsaAddress);
        const dd = await dsa.dydx.getPosition(this.state.dsaAddress);
        let daiprotocol= "";
        let daiamount = 0;
        let ethprotocol = "";
        let ethamount = 0;
        let usdcprotocol = "";
        let usdcamount = 0;

        if(com["dai"].supply>=aav["dai"].supply && com["dai"].supply>=dd["dai"].supply){
            daiprotocol = "compound";
            daiamount = com["dai"].supply;
        } else if (aav["dai"].supply>=com["dai"].supply && aav["dai"].supply>=dd["dai"].supply){
            daiprotocol = "aave";
            daiamount = aav["dai"].supply;
        } else if (dd["dai"].supply>=aav["dai"].supply && dd["dai"].supply>=com["dai"].supply){
            daiprotocol = "dydx";
            daiamount = dd["dai"].supply;
        }

        if(com["eth"].supply>=aav["eth"].supply && com["eth"].supply>=dd["eth"].supply){
            ethprotocol = "compound";
            ethamount = com["eth"].supply;
        } else if (aav["eth"].supply>=com["eth"].supply && aav["eth"].supply>=dd["eth"].supply){
            ethprotocol = "aave";
            ethamount = aav["eth"].supply;
        } else if (dd["eth"].supply>=aav["eth"].supply && dd["eth"].supply>=com["eth"].supply){
            ethprotocol = "dydx";
            ethamount = dd["eth"].supply;
        }

        if(com["usdc"].supply>=aav["usdc"].supply && com["usdc"].supply>=dd["usdc"].supply){
            usdcprotocol = "compound";
            usdcamount = com["usdc"].supply;
        } else if (aav["usdc"].supply>=com["usdc"].supply && aav["usdc"].supply>=dd["usdc"].supply){
            usdcprotocol = "aave";
            usdcamount = aav["usdc"].supply;
        } else if (dd["usdc"].supply>=aav["usdc"].supply && dd["usdc"].supply>=com["usdc"].supply){
            usdcprotocol = "dydx";
            usdcamount = dd["usdc"].supply;
        }
        
        this.setState({
            protocolassetPresent: {
                dai: daiprotocol,
                eth: ethprotocol,
                usdc: usdcprotocol
            },
            totalSupply : {
                dai: daiamount,
                eth: ethamount,
                usdc: usdcamount,
            },
        })
        
    }

    async updateUserData(dsa, amount, message ){
        const id = this.state.dsa_id;
        let daii;
        let ethh;
        let usdcc;
        if(this.state.assetSelected === "dai"){
            daii = this.state.principalAmount.dai + amount;
            ethh = this.state.principalAmount.eth;
            usdcc = this.state.principalAmount.usdc;
        }else if (this.state.assetSelected === "eth"){
            daii = this.state.principalAmount.dai;
            ethh = this.state.principalAmount.eth + amount;
            usdcc = this.state.principalAmount.usdc;
        } else if (this.state.assetSelected === "usdc"){
            daii = this.state.principalAmount.dai;
            ethh = this.state.principalAmount.eth;
            usdcc = this.state.principalAmount.usdc + amount;
        }
        const details = {
            fromTo: message,
            amount: Math.abs(amount),
            type: this.state.assetSelected,
            Dai: daii,
            Eth: ethh,
            USDC: usdcc
        }

        axios.post('http://localhost:1423/users/update/'+ id, details)
            .then(res => {
                console.log(res.data);
                this.dashboardupdate(this.state.dsa)
            });
    }

    async deposit(amount){
        try {
            let spells = await this.state.dsa.Spell();
            spells = await genericDSAdeposit(
                spells,
                this.state.protocolinterestmax[this.state.assetSelected],
                this.state.dsa.tokens.info[this.state.assetSelected].address,
                this.state.dsa.tokens.fromDecimal(amount, this.state.assetSelected)
            );
            const tx = await this.state.dsa.cast({spells: spells})
                .catch((err) => {
                    throw new Error("Transaction is likely to fail, Check you spells once!")
                });
            if (tx) { 
                var message = "deposit in " + this.state.protocolinterestmax[this.state.assetSelected];
                await this.updateUserData(this.state.dsa, amount, message )
                //update details in state;
            }
        } catch(err) {
            console.log(err.message)
        }
    }

    async withdraw(amount){
        try {
            let spells = await this.state.dsa.Spell();
            spells = await genericDSAwithdraw(
                spells,
                this.state.protocolassetPresent[this.state.assetSelected],
                this.state.dsa.tokens.info[this.state.assetSelected].address,
                this.state.dsa.tokens.fromDecimal(amount, this.state.assetSelected),
                this.state.account
            );
            const tx = await this.state.dsa.cast({spells: spells})
                .catch((err) => {
                    throw new Error("Transaction is likely to fail, Check you spells once!")
                });
            if (tx) { 
                var message = "withdraw from " + this.state.protocolassetPresent[this.state.assetSelected];
                await this.updateUserData(this.state.dsa, -1 * amount, message )
                //update details in state;
            }
        } catch(err) {
            console.log(err.message);
        }
    }

    async toggle(){
        var from_protocol = this.state.protocolassetPresent[this.state.toggleassetSelected];
        var to_protocol = this.state.protocolinterestmax[this.state.toggleassetSelected];

        if(from_protocol===to_protocol){
            console.log("already Optimised")
        } else {
            try {
                let spells = await this.state.dsa.Spell();
                spells = await genericDSAtoggle(
                    spells,
                    from_protocol,
                    to_protocol,
                    this.state.dsa.tokens.info[this.state.toggleassetSelected].address,
                    this.state.dsa.tokens.fromDecimal(this.state.totalSupply[this.state.toggleassetSelected] , this.state.assetSelected)
                );
                const tx = await this.state.dsa.cast({spells: spells})
                    .catch((err) => {
                        throw new Error("Transaction is likely to fail, Check you spells once!")
                    });
                if (tx) { 
                    var message = from_protocol +  " to " + to_protocol;
                    //await this.updateUserData(this.state.dsa, amount, message )
                }
            } catch(err) {
                console.log(err.message)
            }
        }
        
    }

    onChangeprotocol(e) {
        this.setState({
            protocol: e.target.value
        })
    }

    onChangetransaction(e) {
        this.setState({
            transaction: e.target.value
        })
    }
    onChangeselectedAsset(e) {
        this.setState({
            assetSelected: e.target.value
        })
    }
    onChangeToggleSelectedAsset (e) {
        this.setState({
            toggleassetSelected: e.target.value
        })
    }
    onChangeAmount(e) {
        this.setState({
            amount: e.target.value
        })
    }

    handleAssetChange = (evt) => {
        try {
            const asset = evt.target.value.toLowerCase();
            this.setState({ assetSelected: asset });
        } catch (err) {
            this.setState({ errMessage: "Connect your Metamask Wallet First" });
            console.log(this.state.errMessage);
        } 
    };

    render() {
        return (
            <div>
                {/* <div id = "navbar" className="header-container fixed-top shadow p-0">
                    <div> 
                        <img src={savifycopy} href="/" alt="SaviFi"  align="left" className="savify-image"/>
                    </div>
                    <div  id = "test" className="header navbar navbar-expand-sm flex-md-nowrap">
                        <button onClick={this.createAccount} align="right" disabled={this.state.buttonDisabled}>
                            {this.state.buttonText}{" "}
                        </button>
                    </div>    
                </div>

                <div id="mySidenav" className="sidenav shadow">
                    <p>DashBoard</p> <br></br>
                    <p>About us</p><br></br>
                </div>

                <div id = "maincontent">
                    <div id = "summary1" className="col-xl-2 col-lg-2 col-md-3 col-sm-4 col-12 layout-spacing shadow">
                        <div className="widget widget-card-four">
                            <div className="widget-content">
                                <div className="w-content">
                                    <div className="w-info">
                                        <p className="value" id="AvgRate">0</p> 
                                        <p className="value" id="">USDC</p><br></br>
                                        <h6 className="cardhead">A/C Summary</h6>
                                    </div>
                                </div>
                            </div>
                        </div>           
                    </div>
                    <div id = "summary2" className="col-xl-2 col-lg-2 col-md-3 col-sm-2 col-12 layout-spacing shadow">
                        <div className="widget widget-card-four">
                            <div className="widget-content">
                                <div className="w-content">
                                    <div className="w-info">
                                        <p className="value" id="AvgRate">0</p> 
                                        <p className="value" id="">Percentage</p><br></br>
                                        <h6 className="cardhead">Principal Amount</h6>
                                    </div>
                                </div>
                            </div>   
                        </div>    
                    </div>

                    <div id = "summary3" className="col-xl-2 col-lg-2 col-md-3 col-sm-2 col-12 layout-spacing shadow inline">
                        <div className="widget widget-card-four">
                            <div className="widget-content">
                                <div className="w-content">
                                    <div className="w-info">
                                        <p className="value" id="AvgRate">0</p> 
                                        <p className="value" id="">Percentage</p><br></br>
                                        <h6 className="cardhead">Interest Earned</h6>
                                    </div>
                                </div>
                            </div>
                        </div>           
                    </div>
                    <div id = "summary4" className="col-xl-2 col-lg-2 col-md-3 col-sm-2 col-12 layout-spacing shadow">
                        <div className="widget widget-card-four">
                            <div className="widget-content">
                                <div className="w-content">
                                    <div className="w-info">
                                        <p className="value" id="AvgRate">0</p> 
                                        <p className="value" id="">Percentage</p><br></br>
                                        <h6 className="cardhead">% Earnings</h6>
                                    </div>
                                </div>
                            </div>
                        </div>           
                    </div>
                </div>
                {/* <div id = "whole">
                    <div>
                        <h1>{this.state.interestRate.Dai.compound}</h1>
                    </div>
                    <select
                        className="select-Asset"
                        onChange={this.handleAssetChange}
                    >
                        <option>{ETH}</option>
                        <option>DAI</option>
                        <option>USDC</option>
                    </select>
                </div> */}
                
                <div className="header-container fixed-top">
                    <div> 
                        <img src={savifycopy} alt="SaviFi"  style={{
                                                                    paddingLeft: "25px",
                                                                    paddingRight: "25px",
                                                                    width: "210px",
                                                                    height: "80px",
                                                                    backgroundColor: "azure"
                            }} ALIGN="left" />
                    </div>
                    
                    <header className="header navbar navbar-expand-sm">
                        <a className="sidebarCollapse" data-placement="bottom"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-list"></svg></a>
                            <div className="media">
                                <div className="user-img">
                                    <div className="avatar avatar-xl">
                                        <span className="avatar-title rounded-circle"></span>
                                    </div>
                                </div>
                                <div className="media-body">
                                    <div className="">
                                        <h5 className="usr-name" id="accountValue">No Account Created</h5>
                                        
                                    </div>
                                </div>
                            </div>
                    </header>
                </div>

                <div className="main-container" id="container">
                    <div className="overlay"></div>
                    <div className="cs-overlay"></div>
                    <div className="search-overlay"></div>

                    <div className="sidebar-wrapper sidebar-theme">
                        <nav id="compactSidebar">
                            <ul className="menu-categories">
                                <li className="menu active">
                                    <a href="#dashboard" data-active="true" className="menu-toggle">
                                        <div className="base-menu">
                                            <div className="base-icons">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-home"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                            </div>
                                            <span>Dashboard</span>
                                        </div>
                                    </a>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-chevron-left"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </li>

                                <li className="menu">
                                    <a href="https://drive.google.com/file/d/1VeQa-g64T1_vmTa8CJuYMTsgeGXC26ND/view" data-active="false" className="menu-toggle">
                                        <div className="base-menu">
                                            <div className="base-icons">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-cpu"><rect x="4" y="4" width="16" height="16" rx="2" ry="2"></rect><rect x="9" y="9" width="6" height="6"></rect><line x1="9" y1="1" x2="9" y2="4"></line><line x1="15" y1="1" x2="15" y2="4"></line><line x1="9" y1="20" x2="9" y2="23"></line><line x1="15" y1="20" x2="15" y2="23"></line><line x1="20" y1="9" x2="23" y2="9"></line><line x1="20" y1="14" x2="23" y2="14"></line><line x1="1" y1="9" x2="4" y2="9"></line><line x1="1" y1="14" x2="4" y2="14"></line></svg>
                                            </div>
                                            <span>White Paper</span>
                                        </div>
                                    </a>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-chevron-left"><polyline points="15 18 9 12 15 6"></polyline></svg>
                                </li>
                            </ul>
                        </nav>

                        <div id="compact_submenuSidebar" className="submenu-sidebar">

                            <div className="submenu" id="dashboard">
                                <ul className="submenu-list" data-parent-element="#dashboard"> 
                                    <li className="active">
                                        <a href="index.html"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-pie-chart"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg> Analytics </a>
                                    </li>
                                </ul>
                            </div>

                            <div className="submenu" id="about us">
                                
                            </div>
                        </div>

                    </div>

                    <div id="content" className="main-content">
                        <div className="layout-px-spacing">
                            <div className="page-header">
                                <div className="page-title">
                                    <h3>Dashboard</h3>
                                </div>
                            </div>
                            <div className="row sales layout-top-spacing">
                                <div className="col-xl-3 col-lg-2 col-md-2 col-sm-2 col-4 layout-spacing">
                                    <div className="widget widget-card-four">
                                        <div className="widget-content">
                                            <div className="w-content">
                                                <div className="w-info">
                                                    <p className="value" id="AvgRate">0</p> 
                                                    <p className="value" id="">Percentage</p>
                                                    <h6 className="">% Earnings</h6>
                                                </div>
                                                <div className=""></div>
                                                </div>
                                            <div className="progress">
                                                <div className="progress-bar bg-gradient-secondary" role="progressbar" style={{width: "57%"}} aria-valuenow="57" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                        </div>
                                    </div>           
                                </div>
                                <div className="col-xl-3 col-lg-2 col-md-2 col-sm-2 col-4 layout-spacing">
                                    <div className="widget widget-card-four">
                                        <div className="widget-content">
                                            <div className="w-content">
                                                <div className="w-info">
                                                    <p className="value" id ="intEarned">0</p> 
                                                    <p className="value" id="">DAI</p>
                                                    <h6 className="">Interest Earned</h6>
                                                </div>
                                                <div className=""></div>
                                                </div>
                                            <div className="progress">
                                                <div className="progress-bar bg-gradient-secondary" role="progressbar" style={{width: "57%"}} aria-valuenow="57" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-xl-3 col-lg-2 col-md-2 col-sm-2 col-4 layout-spacing">
                                    <div className="widget widget-card-four">
                                        <div className="widget-content">
                                            <div className="w-content">
                                                <div className="w-info">
                                                    <p className="value" id = "PAmount">0</p> 
                                                    <p className="value" id="">DAI</p>
                                                    <h6 className="">Principal Amount</h6>
                                                </div>
                                            <div className=""></div>          
                                            </div>
                                            <div className="progress">
                                                <div className="progress-bar bg-gradient-secondary" role="progressbar" style={{width: "57%"}} aria-valuenow="57" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                        </div>
                                    </div>
                                    <br></br>
                                </div>
                                <div className="col-xl-3 col-lg-2 col-md-2 col-sm-2 col-4 layout-spacing">
                                    <div className="widget widget-card-four">
                                        <div className="widget-content">
                                            <div className="w-content">
                                                <div className="w-info">
                                                    <p className="value" id="totalSupply">0</p>
                                                    <p className="value" id="">DAI</p>
                                                    <h6 className="">A/C Summary</h6>
                                                </div> 
                                            </div>
                                            <div className="progress">
                                                <div className="progress-bar bg-gradient-secondary" role="progressbar" style={{width: "57%"}} aria-valuenow="57" aria-valuemin="0" aria-valuemax="100"></div>
                                            </div>
                                        </div>
                                    </div>    
                                </div>
                                
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        );
    }
}
export default App;