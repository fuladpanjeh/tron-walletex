/* eslint-disable no-restricted-globals */
import {connect} from "react-redux";
import React from "react";
import {Modal, ModalBody, ModalHeader} from "reactstrap";
import {tu} from "../../utils/i18n";
import {loadTokenBalances} from "../../mainRedux/actions/actions";
import {FormattedNumber} from "react-intl";
import {Client} from "@tronscan/client" ;
import {ONE_TRX} from "../../constants";
import {buildFreezeBalance} from "@tronscan/client/src/utils/transactionBuilder";

class FreezeBalanceModal extends React.PureComponent {

    constructor(props) {
        super(props);

        this.state = {
            loading: false,
            confirmed: false,
            amount: "",
        };
    }

    componentDidMount() {

        // let {account} = this.props;

        this.props.loadTokenBalances(this.props.address);
    }

    hideModal = () => {
        let {onHide} = this.props;
        onHide && onHide();
    };

    confirmModal = () => {
        let {onConfirm} = this.props;
        let {amount} = this.state;
        onConfirm && onConfirm({
            amount
        });
    };

    onAmountChanged = (ev) => {


        let balance = 0;
        const br = this.props.balancesReducer;

        br.filter(val => {

            return val.address === this.props.address

        }).map((obj) => (balance = obj.balance));

        // let {trxBalance} = this.props;

        let trxBalance = balance;

        let amount = parseInt(ev.target.value, 10);

        if (!isNaN(amount)) {
            amount = amount > 0 ? Math.floor(amount) : Math.abs(amount);
            amount = amount < trxBalance ? amount : trxBalance;
            amount = Math.round(amount);
        } else {
            amount = "";
        }

        this.setState({
            amount,
        });
    };


    freeze = async () => {

        let client = new Client();
        // let {account} = this.props;

        let {amount} = this.state;

        this.setState({loading: true});

        let transaction = buildFreezeBalance(this.props.address, amount * ONE_TRX, 3);

        await client.sendTransaction(this.props.privateKey, transaction);

        this.confirmModal({amount});

        this.setState({loading: false});

    };

    render() {

        let {amount, confirmed, loading} = this.state;

        let balance = 0;

        const br = this.props.balancesReducer;

        br.filter(val => {

            return val.address === this.props.address

        }).map((obj) => (balance = obj.balance));

        // let {trxBalance} = this.props;


        let isValid = !loading && (amount > 0 && balance >= amount && confirmed);

        console.log("Address : " , this.props.address);
        console.log("PrivateKey : " , this.props.privateKey);
        console.log("Balance at line 114 : " , balance) ;

        return (

            <Modal isOpen={true} toggle={this.hideModal} fade={false} className="modal-dialog-centered">

                <ModalHeader className="text-center" toggle={this.hideModal}>
                    {tu("Freeze TRX")}

                </ModalHeader>
                <ModalBody className="text-center">
                    <form>
                        <div className="form-group">
                            <label>{tu("TRX Amount")}</label>
                            <input type="number"
                                   value={amount}
                                   className="form-control text-center"
                                   onChange={this.onAmountChanged}/>
                        </div>
                        <div className="form-check">
                            <input type="checkbox"
                                   className="form-check-input"
                                   onChange={(ev) => this.setState({confirmed: ev.target.checked})}/>
                            <label className="form-check-label">
                                I confirm to freeze <b><FormattedNumber value={amount}/> TRX</b> for at least of 3 days
                            </label>
                        </div>
                        <p className="mt-3">
                            <button className="btn btn-primary col-sm"
                                    disabled={!isValid}
                                    onClick={this.freeze}
                            >
                                <i className="fa fa-snowflake mr-2"/>
                                {tu("Freeze TRX")}
                            </button>
                        </p>
                    </form>
                </ModalBody>
            </Modal>
        )
    }
}

function mapStateToProps(state) {
    return {
        // account: state.app.account,
        // tokenBalances: state.account.tokens,
        // trxBalance: state.account.trxBalance,
        balancesReducer: state.balancesReducer.walletBalances

    };
}

const mapDispatchToProps = {
    loadTokenBalances,
};

export default connect(mapStateToProps, mapDispatchToProps)(FreezeBalanceModal)
