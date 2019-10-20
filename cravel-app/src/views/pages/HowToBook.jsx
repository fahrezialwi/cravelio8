import React, { Component } from 'react'
import Header from '../components/header/Header'
import Footer from '../components/footer/Footer'

class HowToBook extends Component {
    render() {
        return (
            <div>
                <Header/>
                <div>
                    <div className="container container-height">
                        <div className="row pt-5">
                            How To Book Component
                        </div>
                    </div>
                </div>
                <Footer/>
            </div>
        )
    }
}

export default HowToBook