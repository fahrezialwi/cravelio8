import React, { Component } from 'react'
import axios from 'axios'
import { connect } from 'react-redux'
import { Redirect } from 'react-router-dom'
import { onLoginUser } from '../../actions/auth'
import URL_API from '../../config/urlAPI'
import encrypt from '../../config/crypto'
import '../../styles/login.css'

class Login extends Component {

    constructor(props) {
        super(props)
        this.state = {
            loading: '',
            error: ''
        }
    }
    
    onLoginSubmit = (e) => {
        e.preventDefault()
        this.setState({
            loading: true
        })

        let password = encrypt(this.password.value)
        axios.get (
            URL_API + 'login',
            {
                params: {
                    email: this.email.value,
                    password: password
                }
            }
        ).then((res)=> {
            if (res.data.status === 401){
                this.setState({
                    loading: false,
                    error: 'Incorrect email or password.'
                })
                setTimeout(() => { 
                    this.setState({
                        error: ''
                    }) 
                }, 3000)
            } else {
                let {id, first_name, last_name, email, role} = res.data.results[0]
                localStorage.setItem(
                    'userData',
                    JSON.stringify({
                        id, first_name, last_name, email, role
                    })
                )
                this.props.onLoginUser(id, first_name, last_name, email, role)
            }
        })
    }

    loadingButton = () => {
        if(this.state.loading){
            return (
                <div className='spinner-grow' role='status'>
                    <span className='sr-only'></span>
                </div>
            )
        }

        return (
            <button 
                className='btn-block btn btn-dark mt-4'
                onClick={this.onLoginSubmit}
            >
                Login
            </button>
        )

    }

    notification = () => {
        if(this.state.error){
            return (
                <div className='alert alert-danger mt-4'>
                    {this.state.error}
                </div>
            )
        } else {
            return null
        }
    }

    render() {
        if(!this.props.email){
            return (
                <div className="navbar-spacing">
                    <div className="container container-height">
                        <div className="row row-top">
                            <div className="col-sm-8 col-md-4 mx-auto">
                                <div className="card-body">
                                    <h2>Login</h2>
                                    <form onSubmit={this.onLoginSubmit}>
                                        <div className="input-group"><input ref={(input)=>{this.email = input}} type="text" className="form-control mt-3" placeholder="Email"/></div>
                                        <div className="input-group"><input ref={(input)=>{this.password = input}} type="password" className="form-control mt-3" placeholder="Password"/></div>
                                        {this.loadingButton()}
                                    </form>
                                    {this.notification()}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        } else {
            return <Redirect to='/'/>
        }
    }
}

const mapStateToProps = (state) => {
    return {
        email: state.auth.email
    }
}

export default connect(mapStateToProps,{onLoginUser})(Login)

