import React, {Component} from 'react';
import {t, tu} from "../../utils/i18n";
import {Client} from "@tronscan/client";
import {connect} from "react-redux";
// import {loadTokens} from "../../mainRedux/actions/actions";
import {TextField} from "../../utils/formHelper";
import {filter, trim, some, sumBy} from "lodash";
import {ASSET_ISSUE_COST, ONE_TRX} from "../../constants";
import {FormattedNumber} from "react-intl";
import {Alert} from "reactstrap";
import {addDays, addHours} from "date-fns";
import {pkToAddress} from "@tronscan/client/src/utils/crypto";
import {decryptString} from "../../services/encryption_js";
import SweetAlert from "react-bootstrap-sweetalert";


function ErrorLabel(error) {
    if (error !== null) {
        return (
            <small className="text-danger"> {error} </small>
        )
    }

    return null;
}

class CreateToken extends Component {

    constructor() {
        super();

        let startTime = new Date();
        startTime.setHours(0, 0, 0, 0);

        let endTime = new Date();
        endTime.setHours(0, 0, 0, 0);
        endTime.setDate(startTime.getDate() + 90);

        this.state = {
            name: "",
            abbr: "",
            totalSupply: 100000,
            numberOfCoins: 1,
            numberOfTron: 1,
            startTime: startTime.toISOString().split(".")[0],
            endTime: endTime.toISOString().split(".")[0],
            description: "",
            url: "http://",
            confirmed: false,
            loading: false,
            isTokenCreated: false,
            minimumDate: Date.now,
            issuedAsset: null,
            privateKey:"",
            errors: {
                name: null,
                supply: null,
                description: null,
                url: null,
                tronAmount: null,
                tokenAmount: null,
                startDate: null,
                endDate: null,
                abbr: null,
            },

            valid: false,
            submitMessage: null,
            frozenSupply: [],

            selectedWallet :"Select your Wallet",
            modal:null,
            modal1:null ,
            modal2:null
        };
    }


    handleChange= event=>{

         this.setState({ selectedWallet: event.target.value });

         if(event.target.value !=="Select your Wallet") {

             this.checkExistingToken(event.target.value);

             this.setState({modal:(

                     <SweetAlert
                         confirmBtnText="Decrypt"
                         input
                         inputType="password"
                         cancelBtnBsStyle="default"
                         title={ <small className="small">Enter your wallet password</small>}
                         required
                         onConfirm={this.onConfirm}
                         validationMsg="You must enter your password!"
                     />
                 )

             })
         }
         else {

             this.setState({issuedAsset: null,})
         }
    };


    isValidDecryptedPKey = (address ,pKey)=>{


        let addr  = "" ;

        try {

            addr  = pkToAddress(pKey);

        }
        catch (e) {

            console.log(e);

        }

        return addr=== address;
    };


    onConfirm = event =>{

        let { selectedWallet , privateKey} = this.state;

        const obj =  this.props.wallets.filter(val => {

            return selectedWallet === val.address;

        });

        const pKey = decryptString(event , obj[0].key);



        if( this.isValidDecryptedPKey(selectedWallet , pKey) )
        {

            this.setState({modal:null , privateKey:pKey});

            this.setState({modal1:(<SweetAlert  success title="Success" onConfirm={this.hideAlert1}>

                    the private key was decrypted successfully

                </SweetAlert> )});

        }else {

            this.setState({modal:null});

            this.setState({modal2: (

                    <SweetAlert danger title="Wrong Password" confirmBtnText="Try again" onConfirm={this.hideAlert2 } >

                        you entered a wrong password! Try again

                    </SweetAlert>

                ) })

        }

    };


    hideAlert1 =()=>{

        this.setState({modal1:null });

    };


    hideAlert2=()=>{

        this.setState({modal2:null, privateKey:""});
        this.setState({modal:(

                <SweetAlert
                    confirmBtnText="Decrypt"
                    input
                    inputType="password"
                    cancelBtnBsStyle="default"
                    title={ <small className="small">Enter your wallet password</small>}
                    required
                    onConfirm={this.onConfirm}
                    validationMsg="You must enter your password!"
                />
            )

        })

    };




    whichAddressSelected =() => {

         let {selectedWallet} = this.state ;

         console.log("Selected Value after  Calling CHeckk Exsiting 58: " , selectedWallet)

         let wallet ={address :"" , key:"" , name:""};

         let fr = this.props.wallets ;

         fr.filter(val =>{

             return val.address === selectedWallet

         }).map((obj)=>(wallet=obj));


         return wallet ;
    };


    submit = async () => {


        const {privateKey} = this.state ;
        const wallet = this.whichAddressSelected();


        this.setState({ loading: true, submitMessage: null });

        try {
            let {success} = await new  Client().createToken({
                address: wallet.address,
                name: trim(this.state.name),
                shortName: trim(this.state.abbr),
                totalSupply: this.state.totalSupply,
                num: this.state.numberOfCoins,
                trxNum: this.state.numberOfTron * ONE_TRX,
                startTime: this.state.startTime,
                endTime: this.state.endTime,
                description: this.state.description,
                url: this.state.url,
                frozenSupply: filter(this.state.frozenSupply, fs => fs.amount > 0),
            })(privateKey);

            if (success) {
                this.setState({
                    isTokenCreated: true,
                });
            } else {
                this.setState({
                    submitMessage: (
                        <Alert color="warning" className="text-center">
                            An error occurred while trying to create the token
                        </Alert>
                    )
                });
            }

        } finally {
            this.setState({ loading: false ,  privateKey:"" });
        }
    };

    isValid = () => {

        let { loading, name, abbr, totalSupply, numberOfCoins, numberOfTron, startTime, endTime, description, url, confirmed } = this.state;


        let newErrors = {
            name: null,
            supply: null,
            description: null,
            url: null,
            tronAmount: null,
            tokenAmount: null,
            startDate: null,
            endDate: null,
        };

        if (loading) {
            return {
                errors: newErrors,
                valid: false,
            };
        }

        if (confirmed) {

            name = trim(name);

            if (name.length === 0) {
                newErrors.name = tu("no_name_error");
            } else if (name.length > 32) {
                newErrors.name = tu("Name may not be longer then 32 characters");
            } else if (!/^[a-zA-Z]+$/i.test(name)) {
                newErrors.name = tu("Name may only contain a-Z characters");
            }

            abbr = trim(abbr);

            if (abbr.length === 0) {
                newErrors.abbr = tu("Abbreviation is required");
            } else if (abbr.length > 5) {
                newErrors.abbr = tu("Abbreviation may not be longer then 5 characters");
            } else if (!/^[a-zA-Z]+$/i.test(abbr)) {
                newErrors.abbr = tu("Abbreviation may only contain a-Z characters");
            }

            if (description.length === 0) {
                newErrors.description = tu("no_description_error");
            } else if (description.length > 200) {
                newErrors.description = tu("Description may not be longer then 200 characters");
            }
        }

        if (totalSupply <= 0)
            newErrors.supply = tu("no_supply_error");

        if (url.length === 0)
            newErrors.url = tu("no_url_error");

        if (numberOfTron <= 0)
            newErrors.tronAmount = tu("tron_value_error");

        if (numberOfCoins <= 0)
            newErrors.tokenAmount = tu("coin_value_error");

        if (!startTime)
            newErrors.startDate = tu("invalid_starttime_error");

        let calculatedStartTime = new Date(startTime).getTime();

        if (calculatedStartTime < Date.now())
            newErrors.startDate = tu("past_starttime_error");

        if (!endTime)
            newErrors.endDate = tu("invalid_endtime_error");

        if (new Date(endTime).getTime() <= calculatedStartTime)
            newErrors.endDate = tu("date_error");

        return {
            errors: newErrors,
            valid: confirmed === true && !some(Object.values(newErrors), error => error !== null),
        };
    };

    isLoggedIn = () => {
        let {account} = this.props;
        return account.isLoggedIn;
    };

    componentDidMount() {
        this.setStartTime();
        //this.checkExistingToken();
    }

    checkExistingToken =  (e) => {


        this.setState({issuedAsset:null});

        let selectedWallet = e ;

        let wallet = null ;

            let fr = this.props.wallets;

            fr.filter(val => {

                return val.address === selectedWallet

            }).map((obj) => (wallet = obj));


            const client = new Client();


            if (wallet !== null) {

                console.log("Wallet in CheckExisting Token in if  277: ", wallet);

                client.getIssuedAsset(wallet.address).then(({token}) => {
                    if (token) {
                        this.setState({
                            issuedAsset: token,
                        });
                    }
                });
            }

    };


    setStartTime = async () => {
        let block = await new Client().getLatestBlock();

        let startTime = addDays(new Date(block.timestamp), 1);
        let minimumTime = addHours(new Date(block.timestamp), 1);

        this.setState({
            startTime: startTime.toISOString().split(".")[0],
            minimumTime,
        });
    };

    componentDidUpdate(prevProps, prevState) {
        let {frozenSupply} = this.state;

        if (frozenSupply.length === 0) {
            this.setState({
                frozenSupply: [
                    {
                        amount: 0,
                        days: 1,
                    }
                ]
            });
        } else if (frozenSupply.length > 0) {

            let emptyFields = this.getEmptyFrozenFields();

            if (emptyFields.length === 0) {
                this.setState({
                    frozenSupply: [
                        ...frozenSupply,
                        {
                            amount: 0,
                            days: 1,
                        }
                    ]
                });
            }
        }

        let newState = {};
        let hasChange = false;

        for (let field of Object.keys(this.state)) {
            let value = this.state[field];
            if (value !== prevState[field]) {
                hasChange = true;
                switch (field) {
                    case "num":
                        value = value > 1 || value === "" ? value : 1;
                        break;
                    case "trxNum":
                        value = value > 1 || value === "" ? value : 1;
                        break;
                    case "totalSupply":
                        value = value > 1 || value === "" ? value : 1;
                        break;
                    default : return  ;
                }
            }
            newState[field] = value;
        }

        if (hasChange) {
            this.setState(newState);
        }
    }

    getEmptyFrozenFields = () => {

        let {frozenSupply} = this.state;
        return filter(frozenSupply, fs => Math.round(parseInt(fs.amount)) === 0 || fs.amount === "");

    };

    getTheWalletInfo =(address)=>{


        let balance = {
            address:'',
            balance: 0,
            balances: [],
            bandwidth:{ assets:{}, freeNetUsed: 0, freeNetLimit: 0, freeNetRemaining: 0, freeNetPercentage: 0, netUsed: 0  },
            frozen:{total:0 , balances:[]},
            name: '',
            representative: {allowance:0 , enabled:false  , lastWithDrawTime:0, url:null} ,

        };



        this.props.balancesReducer.filter(val => (
            val.address === address
        )).map(obj=>(balance= obj));

        console.log("balance in get the wallet info line 362 : " , balance ) ;

        return balance  ;
    };


    renderSubmit = () => {

        let {isTokenCreated} = this.state;
        let {valid} = this.isValid();

        // let {wallet} = this.props;

        let wallet = this.whichAddressSelected();

        console.log("Wallet in line 396 : " , wallet)  ;



        if (isTokenCreated) {
            return (
                <Alert color="primary" className="text-center">
                    {tu("token_issued_successfully")}
                </Alert>
            );
        }

        if (!wallet) {
            return (
                <Alert color="warning" className="text-center">
                    You need to open a wallet to be able to create a token
                </Alert>
            );
        }

        if (this.getTheWalletInfo(wallet.address).balance < ASSET_ISSUE_COST) {
            return (
                <Alert color="danger" className="text-center">
                    1024 TRX is required to issue a new token
                </Alert>
            );
        }

        return (
            <div className="text-center">
                <button
                    disabled={!valid}
                    type="button"
                    className="btn btn-success"
                    onClick={this.submit}>{tu("issue_token")}</button>
            </div>
        );
    };

    updateFrozen(index, values) {

        let {frozenSupply} = this.state;

        frozenSupply[index] = {
            ...frozenSupply[index],
            ...values
        };

        for (let frozen of frozenSupply) {

            if (trim(frozen.amount) !== "")
                frozen.amount = parseInt(frozen.amount);

            if (trim(frozen.days) !== "")
                frozen.days = parseInt(frozen.days);

            frozen.amount = frozen.amount > 0  || frozen.amount === "" ? frozen.amount : 0;
            frozen.days = frozen.days > 0  || frozen.days === "" ? frozen.days : 1;
        }

        this.setState({
            frozenSupply,
        });
    }

    blurFrozen(index) {
        let {frozenSupply} = this.state;

        let isEmpty = frozenSupply[index].amount <= 0 || frozenSupply[index].amount === "";

        if (isEmpty && this.getEmptyFrozenFields().length >= 2) {
            frozenSupply.splice(index, 1);
        }

        this.setState({
            frozenSupply,
        });
    }

    selectedWallet(selectedWallet , errors , name , url , numberOfCoins , numberOfTron , exchangeRate , frozenSupply , submitMessage , issuedAsset)
    {
        if (selectedWallet==="Select your Wallet") {

            if(this.props.wallets.length ===0)
            return (
                <div className="container pb-3 text-center ">
                    <div className="row">

                        <div className="col-md-3"> </div>
                        <div className="col-sm-6">

                            <div className="card">
                                <div className="card-body">

                                    <div className="text-center p-3">

                                        you have not added any wallet yet <br/>
                                        click on <a href="#/AddWallet">Create Token</a> to add or generate new wallet


                                    </div>

                                </div>

                            </div>

                        </div>
                        <div className="col-md-3"> </div>

                    </div>

                    <div/>
                </div>
            );

            else {

                return (
                    <div className="container pb-3 text-center ">
                        <div className="row">

                            <div className="col-md-3"> </div>
                            <div className="col-sm-6">

                                <div className="card">
                                    <div className="card-body">

                                        <div className="text-center p-3">

                                            you have not select your wallet <br/>


                                        </div>

                                    </div>

                                </div>

                            </div>
                            <div className="col-md-3"> </div>

                        </div>

                        <div/>
                    </div>
                );

            }
        }


        else {


            if (issuedAsset !== null) {
                return (
                    <main className="container pb-3 token-create header-overlap">

                        <div className="row">

                            <div className="col-md-3"> </div>
                            <div className="col-sm-6">
                                <div className="card">
                                    <div className="card-body">
                                        <div className="text-center p-3">
                                            You may create only one token per account
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-3"> </div>



                        </div>
                    </main>
                );
            }


            return (<main className="container pb-3 token-create header-overlap">

                <div className="row">

                    <div className="col-sm-12 col-md-8">

                        <div className="card">

                            <div className="card-body">

                                <h5 className="card-title text-center">

                                    {tu("issue_a_token")}

                                </h5>

                                <form>
                                    <fieldset>
                                        <legend>
                                            {tu("Details")}
                                            <i className="fab fa-wpforms float-right"/>
                                        </legend>
                                        <div className="form-row">
                                            <div className="form-group col-md-6">
                                                <label>{tu("token_name")} *</label>
                                                <TextField cmp={this} field="name" />
                                                <small className="form-text text-muted">
                                                    Name for the token
                                                </small>
                                                { ErrorLabel(errors.name)}
                                            </div>
                                            <div className="form-group col-md-6">
                                                <label>{tu("token_abbr")} *</label>
                                                <TextField cmp={this} field="abbr" />
                                                <small className="form-text text-muted">
                                                    Abbreviation for the token
                                                </small>
                                                { ErrorLabel(errors.abbr)}
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-md-12">
                                                <label>{tu("total_supply")} *</label>
                                                <TextField type="number" cmp={this} field="totalSupply" />
                                                <small className="form-text text-muted">
                                                    {tu("supply_message")}
                                                </small>
                                                { ErrorLabel(errors.supply)}
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-md-12">
                                                <label>{tu("description")} *</label>
                                                <TextField type="text" cmp={this} field="description" />
                                                <small className="form-text text-muted">
                                                    {tu("description_message")}
                                                </small>
                                                { ErrorLabel(errors.description)}
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-md-12">
                                                <label>{tu("Website URL")} *</label>
                                                <TextField type="text" cmp={this} field="url" placeholder="http://" />
                                                <small className="form-text text-muted">
                                                    {tu("url_message")}
                                                </small>
                                                { url !== "" && ErrorLabel(errors.url)}
                                            </div>
                                        </div>
                                    </fieldset>
                                    <hr/>
                                    <fieldset>
                                        <legend>
                                            {tu("exchange_rate")}
                                            <i className="fa fa-exchange-alt float-right"/>
                                        </legend>

                                        <div className="form-row">
                                            <p className="col-md-12">
                                                {tu("exchange_rate_message_0")}
                                            </p>
                                            <p className="col-md-12">
                                                {tu("exchange_rate_message_1")} <b><FormattedNumber value={numberOfCoins} /> {name || tu("token")}</b>&nbsp;
                                                {tu("exchange_rate_message_2")} <b><FormattedNumber value={numberOfTron} /> {tu("exchange_rate_message_3")}</b>.
                                            </p>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-md-6">
                                                <label>TRX {tu("amount")} *</label>
                                                <TextField type="number" cmp={this} field="numberOfTron" />
                                                { numberOfTron !== "" && ErrorLabel(errors.tronAmount)}
                                            </div>
                                            <div className="form-group col-md-6">
                                                <label>{tu("token")} {tu("amount")} *</label>
                                                <TextField type="number" cmp={this} field="numberOfCoins" />
                                                { numberOfCoins !== "" && ErrorLabel(errors.tokenAmount)}
                                            </div>
                                        </div>
                                        <div className="form-row">
                                            <p className="col-md-12">
                                                <b>{tu("token_price")}</b>: 1 {name || tu("token")} = <FormattedNumber value={exchangeRate} /> TRX
                                            </p>
                                        </div>
                                    </fieldset>
                                    <hr/>
                                    <fieldset>
                                        <legend>
                                            {tu("Frozen Supply")}
                                            <i className="fa fa-snowflake float-right"/>
                                        </legend>

                                        <div className="form-row text-muted">
                                            <p className="col-md-12">
                                                A part of the supply can be frozen. The amount of supply can be specified and must be frozen
                                                for a minimum of 1 day. The frozen supply can manually be unfrozen after start date + frozen
                                                days has been reached. Freezing supply is not required.
                                            </p>
                                        </div>
                                        {
                                            frozenSupply.map((frozen, index) => (
                                                <div key={index} className={"form-row " + (frozenSupply.length === index + 1 ? "text-muted" : "")}>
                                                    <div className="form-group col-md-9">
                                                        { index === 0 && <label>{tu("Amount")}</label> }
                                                        <input
                                                            className="form-control"
                                                            type="number"
                                                            value={frozen.amount}
                                                            onBlur={() => this.blurFrozen(index)}
                                                            onChange={(ev) => this.updateFrozen(index, { amount: ev.target.value })}
                                                        />
                                                    </div>
                                                    <div className="form-group col-md-3">
                                                        { index === 0 && <label>{tu("Days to freeze")}</label> }
                                                        <input
                                                            className="form-control"
                                                            type="number"
                                                            onChange={(ev) => this.updateFrozen(index, { days: ev.target.value })}
                                                            value={frozen.days} />
                                                    </div>
                                                </div>
                                            ))
                                        }
                                        {
                                            frozenSupply.length > 1 &&
                                            <div>
                                                Total Frozen Supply: {sumBy(frozenSupply, fs => parseInt(fs.amount))}
                                            </div>
                                        }
                                    </fieldset>
                                    <hr/>
                                    <fieldset>
                                        <legend>
                                            {tu("participation")}
                                            <i className="fa fa-calendar-alt float-right"/>
                                        </legend>

                                        <div className="form-row text-muted">
                                            <p className="col-md-12">
                                                {tu("participation_message_0")}{name}{tu("participation_message_1")}
                                            </p>
                                        </div>
                                        <div className="form-row">
                                            <div className="form-group col-md-6">
                                                <label>{tu("start_date")}</label>
                                                <TextField type="datetime-local" cmp={this} field="startTime" max="9999-12-31T23:59"/>
                                                {ErrorLabel(errors.startDate)}
                                            </div>
                                            <div className="form-group col-md-6">
                                                <label>{tu("end_date")}</label>
                                                <TextField type="datetime-local" cmp={this} field="endTime" max="9999-12-31T23:59"/>
                                                {ErrorLabel(errors.endDate)}
                                            </div>
                                        </div>
                                    </fieldset>
                                    <div className="form-group">
                                        <div className="form-check">
                                            <TextField type="checkbox" cmp={this} field="confirmed" className="form-check-input" />
                                            <label className="form-check-label">
                                                {tu("token_spend_confirm")}
                                            </label>
                                        </div>
                                    </div>
                                    {submitMessage}
                                    {this.renderSubmit()}
                                </form>
                            </div>
                        </div>
                    </div>
                    <div className="col-sm-12 col-md-4 mt-3 mt-md-0">
                        <div className="card">
                            <div className="card-body">
                                <p>
                                    {t("token_issue_guide_message_1")}
                                </p>
                                <p>
                                    {t("token_issue_guide_message_2")}
                                </p>
                                <p>
                                    {t("token_issue_guide_message_3")}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </main>);



        }

    };


    avoidCreateToken(issuedAsset){

        if (issuedAsset !== null) {
            return (
                <main className="container pb-3 token-create header-overlap">
                    <div className="row">
                        <div className="col-sm-8">
                            <div className="card">
                                <div className="card-body">
                                    <div className="text-center p-3">
                                        You may create only one token per account
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            );
        }


    }

    render() {
        let {numberOfCoins, numberOfTron, name,
            submitMessage, frozenSupply, url,
            confirmed, loading, issuedAsset ,
            selectedWallet , modal , modal1 , modal2
        } = this.state;

        console.log("issuedAsset : " , issuedAsset) ;

        let {valid, errors} = this.isValid();

        let exchangeRate = numberOfTron / numberOfCoins;

        if (!loading && confirmed && !valid) {
            submitMessage = (
                <Alert color="warning" className="text-center">

                    There are errors in the form

                </Alert>
            );
        }

        return (

            <main className="container">
                {modal}
                {modal1}
                {modal2}
            <div className="row mt-4 mb-2">

                <div className="col-md-3"> </div>
                <div className="col-md-6">
                    <div className="form-group">

                        {/*<label>{tu("wallet")}</label>*/}
                        <div className="input-group mb-3">

                            <select
                                className="form-control"
                                onChange={this.handleChange }
                                value={selectedWallet}>
                                <option  name="Select your Wallet">Select your Wallet</option>
                                {
                                    this.props.wallets.map((wallet)=>(
                                        <option key ={wallet.name} value={wallet.address} >
                                            {wallet.address}
                                            </option>

                                    ))
                                }

                                </select>
                        </div>
                    </div>


                </div>
                <div className="col-md-3"> </div>

            </div>

                <div className="row">
                    {
                        this.selectedWallet(selectedWallet , errors , name , url , numberOfCoins , numberOfTron , exchangeRate , frozenSupply , submitMessage , issuedAsset)
                    }
                    {/*{this.avoidCreateToken(issuedAsset)}*/}

                </div>


</main>
        )


        // return (
        //
        //     <main className="container pb-3 token-create header-overlap">
        //
        //         <div className="row">
        //
        //             <div className="col-sm-12 col-md-8">
        //
        //                 <div className="card">
        //
        //                     <div className="card-body">
        //
        //                         <h5 className="card-title text-center">
        //
        //                             {tu("issue_a_token")}
        //
        //                         </h5>
        //
        //                         <form>
        //                             <fieldset>
        //                                 <legend>
        //                                     {tu("Details")}
        //                                     <i className="fab fa-wpforms float-right"/>
        //                                 </legend>
        //                                 <div className="form-row">
        //                                     <div className="form-group col-md-6">
        //                                         <label>{tu("token_name")} *</label>
        //                                         <TextField cmp={this} field="name" />
        //                                         <small className="form-text text-muted">
        //                                             Name for the token
        //                                         </small>
        //                                         { ErrorLabel(errors.name)}
        //                                     </div>
        //                                     <div className="form-group col-md-6">
        //                                         <label>{tu("token_abbr")} *</label>
        //                                         <TextField cmp={this} field="abbr" />
        //                                         <small className="form-text text-muted">
        //                                             Abbreviation for the token
        //                                         </small>
        //                                         { ErrorLabel(errors.abbr)}
        //                                     </div>
        //                                 </div>
        //                                 <div className="form-row">
        //                                     <div className="form-group col-md-12">
        //                                         <label>{tu("total_supply")} *</label>
        //                                         <TextField type="number" cmp={this} field="totalSupply" />
        //                                         <small className="form-text text-muted">
        //                                             {tu("supply_message")}
        //                                         </small>
        //                                         { ErrorLabel(errors.supply)}
        //                                     </div>
        //                                 </div>
        //                                 <div className="form-row">
        //                                     <div className="form-group col-md-12">
        //                                         <label>{tu("description")} *</label>
        //                                         <TextField type="text" cmp={this} field="description" />
        //                                         <small className="form-text text-muted">
        //                                             {tu("description_message")}
        //                                         </small>
        //                                         { ErrorLabel(errors.description)}
        //                                     </div>
        //                                 </div>
        //                                 <div className="form-row">
        //                                     <div className="form-group col-md-12">
        //                                         <label>{tu("Website URL")} *</label>
        //                                         <TextField type="text" cmp={this} field="url" placeholder="http://" />
        //                                         <small className="form-text text-muted">
        //                                             {tu("url_message")}
        //                                         </small>
        //                                         { url !== "" && ErrorLabel(errors.url)}
        //                                     </div>
        //                                 </div>
        //                             </fieldset>
        //                             <hr/>
        //                             <fieldset>
        //                                 <legend>
        //                                     {tu("exchange_rate")}
        //                                     <i className="fa fa-exchange-alt float-right"/>
        //                                 </legend>
        //
        //                                 <div className="form-row">
        //                                     <p className="col-md-12">
        //                                         {tu("exchange_rate_message_0")}
        //                                     </p>
        //                                     <p className="col-md-12">
        //                                         {tu("exchange_rate_message_1")} <b><FormattedNumber value={numberOfCoins} /> {name || tu("token")}</b>&nbsp;
        //                                         {tu("exchange_rate_message_2")} <b><FormattedNumber value={numberOfTron} /> {tu("exchange_rate_message_3")}</b>.
        //                                     </p>
        //                                 </div>
        //                                 <div className="form-row">
        //                                     <div className="form-group col-md-6">
        //                                         <label>TRX {tu("amount")} *</label>
        //                                         <TextField type="number" cmp={this} field="numberOfTron" />
        //                                         { numberOfTron !== "" && ErrorLabel(errors.tronAmount)}
        //                                     </div>
        //                                     <div className="form-group col-md-6">
        //                                         <label>{tu("token")} {tu("amount")} *</label>
        //                                         <TextField type="number" cmp={this} field="numberOfCoins" />
        //                                         { numberOfCoins !== "" && ErrorLabel(errors.tokenAmount)}
        //                                     </div>
        //                                 </div>
        //                                 <div className="form-row">
        //                                     <p className="col-md-12">
        //                                         <b>{tu("token_price")}</b>: 1 {name || tu("token")} = <FormattedNumber value={exchangeRate} /> TRX
        //                                     </p>
        //                                 </div>
        //                             </fieldset>
        //                             <hr/>
        //                             <fieldset>
        //                                 <legend>
        //                                     {tu("Frozen Supply")}
        //                                     <i className="fa fa-snowflake float-right"/>
        //                                 </legend>
        //
        //                                 <div className="form-row text-muted">
        //                                     <p className="col-md-12">
        //                                         A part of the supply can be frozen. The amount of supply can be specified and must be frozen
        //                                         for a minimum of 1 day. The frozen supply can manually be unfrozen after start date + frozen
        //                                         days has been reached. Freezing supply is not required.
        //                                     </p>
        //                                 </div>
        //                                 {
        //                                     frozenSupply.map((frozen, index) => (
        //                                         <div key={index} className={"form-row " + (frozenSupply.length === index + 1 ? "text-muted" : "")}>
        //                                             <div className="form-group col-md-9">
        //                                                 { index === 0 && <label>{tu("Amount")}</label> }
        //                                                 <input
        //                                                     className="form-control"
        //                                                     type="number"
        //                                                     value={frozen.amount}
        //                                                     onBlur={() => this.blurFrozen(index)}
        //                                                     onChange={(ev) => this.updateFrozen(index, { amount: ev.target.value })}
        //                                                 />
        //                                             </div>
        //                                             <div className="form-group col-md-3">
        //                                                 { index === 0 && <label>{tu("Days to freeze")}</label> }
        //                                                 <input
        //                                                     className="form-control"
        //                                                     type="number"
        //                                                     onChange={(ev) => this.updateFrozen(index, { days: ev.target.value })}
        //                                                     value={frozen.days} />
        //                                             </div>
        //                                         </div>
        //                                     ))
        //                                 }
        //                                 {
        //                                     frozenSupply.length > 1 &&
        //                                     <div>
        //                                         Total Frozen Supply: {sumBy(frozenSupply, fs => parseInt(fs.amount))}
        //                                     </div>
        //                                 }
        //                             </fieldset>
        //                             <hr/>
        //                             <fieldset>
        //                                 <legend>
        //                                     {tu("participation")}
        //                                     <i className="fa fa-calendar-alt float-right"/>
        //                                 </legend>
        //
        //                                 <div className="form-row text-muted">
        //                                     <p className="col-md-12">
        //                                         {tu("participation_message_0")}{name}{tu("participation_message_1")}
        //                                     </p>
        //                                 </div>
        //                                 <div className="form-row">
        //                                     <div className="form-group col-md-6">
        //                                         <label>{tu("start_date")}</label>
        //                                         <TextField type="datetime-local" cmp={this} field="startTime" max="9999-12-31T23:59"/>
        //                                         {ErrorLabel(errors.startDate)}
        //                                     </div>
        //                                     <div className="form-group col-md-6">
        //                                         <label>{tu("end_date")}</label>
        //                                         <TextField type="datetime-local" cmp={this} field="endTime" max="9999-12-31T23:59"/>
        //                                         {ErrorLabel(errors.endDate)}
        //                                     </div>
        //                                 </div>
        //                             </fieldset>
        //                             <div className="form-group">
        //                                 <div className="form-check">
        //                                     <TextField type="checkbox" cmp={this} field="confirmed" className="form-check-input" />
        //                                     <label className="form-check-label">
        //                                         {tu("token_spend_confirm")}
        //                                     </label>
        //                                 </div>
        //                             </div>
        //                             {submitMessage}
        //                             {this.renderSubmit()}
        //                         </form>
        //                     </div>
        //                 </div>
        //             </div>
        //             <div className="col-sm-12 col-md-4 mt-3 mt-md-0">
        //                 <div className="card">
        //                     <div className="card-body">
        //                         <p>
        //                             {t("token_issue_guide_message_1")}
        //                         </p>
        //                         <p>
        //                             {t("token_issue_guide_message_2")}
        //                         </p>
        //                         <p>
        //                             {t("token_issue_guide_message_3")}
        //                         </p>
        //                     </div>
        //                 </div>
        //             </div>
        //         </div>
        //     </main>
        // )
    }
}

function mapStateToProps(state) {
    return {

        tokens: state.tokensReducer.tokens,
        account: state.app.account,
        // wallet: state.wallet.current,
        wallets : state.walletsReducer.wallets,
        balancesReducer: state.balancesReducer.walletBalances,


    };
}

const mapDispatchToProps = {

};

export default connect(mapStateToProps, mapDispatchToProps)(CreateToken);