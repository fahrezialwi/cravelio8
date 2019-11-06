import React, { Component } from 'react'
import { connect } from 'react-redux'
import { Tab, Tabs } from 'react-bootstrap'
import axios from 'axios'
import moment from 'moment'
import { FilePond, registerPlugin } from 'react-filepond'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond/dist/filepond.min.css'
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css'
import Header from '../../components/header/Header'
import Footer from '../../components/footer/Footer'
import URL_API from '../../../configs/urlAPI'

registerPlugin(FilePondPluginImagePreview)

class Review extends Component {

    constructor(props) {
        super(props)
        this.state = {
            pendingReviews: [],
            completedReviews: [],
            files: [],
            pictures: []
        }
    }

    componentDidMount() {
        this.getPendingReviewsData()
        this.getCompletedReviewsData()
    }

    getPendingReviewsData = () => {
        axios.get(
            URL_API + 'pending_reviews', {
                params: {
                    user_id: this.props.userId
                }
            }
        ).then(res => {
            this.setState({
                pendingReviews: res.data.results
            })
        })
    }

    getCompletedReviewsData = () => {
        axios.get(
            URL_API + 'reviews', {
                params: {
                    user_id: this.props.userId
                }
            }
        ).then(res => {
            this.setState({
                completedReviews: res.data.results
            })
        })
    }

    onStarChange = (index, value) => {
        let newPendingReviews = [...this.state.pendingReviews]
        newPendingReviews[index].star = value
        this.setState({
            pendingReviews: newPendingReviews
        })
    }

    onReviewTitleChange = (index, value) => {
        let newPendingReviews = [...this.state.pendingReviews]
        newPendingReviews[index].review_title = value
        this.setState({
            pendingReviews: newPendingReviews
        })
    }

    onReviewContentChange = (index, value) => {
        let newPendingReviews = [...this.state.pendingReviews]
        newPendingReviews[index].review_content = value
        this.setState({
            pendingReviews: newPendingReviews
        })
    }

    createPicturesArray = () => {
        let pictures = this.state.files.map(file => {
            return file.name
        })

        this.setState({
            pictures
        })
    }

    onSaveClick = (index, tripId, transactionId) => {
        
        if (
            this.state.pendingReviews[index].review_title &&
            this.state.pendingReviews[index].review_content &&
            this.state.pendingReviews[index].star
        ) {
            axios.post(
                URL_API + 'reviews', {
                    review_title: this.state.pendingReviews[index].review_title,
                    review_content: this.state.pendingReviews[index].review_content,
                    star: this.state.pendingReviews[index].star,
                    trip_id: tripId,
                    user_id: this.props.userId,
                    transaction_id: transactionId
                }
            ).then(res => {
                axios.patch(
                    URL_API + 'reviews_picture', {
                        reviews_picture: this.state.pictures,
                        insert_id: res.data.results.insertId
                    }
                ).then(res => {
                    alert("Thank you for reviewing this trip")
                    this.getPendingReviewsData()
                    this.getCompletedReviewsData()
    
                    this.refs.reviewTitle.value = ''
                    this.refs.reviewContent.value = ''
                    this.refs.star.value = ''
                    this.setState({
                        pictures: [],
                        files: []
                    })
    
                    window.scrollTo(0, 0)
                })
            })
        } else {
            alert("Please fill all form")
        }
    }

    pendingReviewList = () => {
        return this.state.pendingReviews.map((review, index) => {
            return (
                <tr key={index}>
                    <td>{review.trip_name}</td>
                    <td>{review.total_payment}</td>
                    <td>{moment(review.created_at).format('MMM Do YYYY, HH:mm:ss')}</td>
                    <td>
                        <input
                            type="number"
                            min="1"
                            max="5"
                            ref="star"
                            onChange={e => this.onStarChange(index, parseInt(e.target.value))}
                            className="form-control"
                        />
                    </td>
                    <td>
                        <input
                            type="text"
                            ref="reviewTitle"
                            onChange={e => this.onReviewTitleChange(index, e.target.value)}
                            className="form-control"
                        />
                    </td>
                    <td>
                        <input
                            type="text"
                            ref="reviewContent"
                            onChange={e => this.onReviewContentChange(index, e.target.value)}
                            className="form-control"
                        />
                    </td>
                    <td>
                        <FilePond 
                            ref={ref => this.pond = ref}
                            files={this.state.files}
                            allowMultiple={true}
                            // onprocessfiles={() => this.createPicturesArray()}
                            onupdatefiles={fileItems => {
                                this.setState({
                                    files: fileItems.map(fileItem => {
                                        return fileItem.file
                                    })
                                })
                            }}
                            server={{
                                process: (fieldName, file, metadata, load, error, progress, abort, transfer, options) => {
                                    const fd = new FormData()
                                    fd.append(fieldName, file, file.name)
                        
                                    const xhr = new XMLHttpRequest()
                                    xhr.open('POST', URL_API + 'reviews_picture')
                        
                                    xhr.upload.onprogress = (e) => {
                                        progress(e.lengthComputable, e.loaded, e.total)
                                    }
                    
                                    xhr.onload = () => {
                                        if (xhr.status >= 200 && xhr.status < 300) {
                                            load(xhr.responseText)
                                        } else {
                                            error('Upload error')
                                        }
                                    }

                                    xhr.onreadystatechange = () => {
                                        if (xhr.readyState === XMLHttpRequest.DONE) {
                                            let pictures = [...this.state.pictures]
                                            pictures.push(xhr.responseText)
                                            this.setState({
                                                pictures
                                            })
                                        }
                                    }

                                    xhr.send(fd)
                                    return {
                                        abort: () => {
                                            xhr.abort()
                                            abort()
                                        }
                                    }
                                },

                                revert: (uniqueFileId, load, error) => {
                                    const xhr = new XMLHttpRequest()
                                    xhr.open('DELETE', URL_API + 'reviews_picture')
                                    xhr.send(uniqueFileId)

                                    let pictures = [...this.state.pictures]
                                    pictures.pop()
                                    this.setState({
                                        pictures
                                    })

                                    error('Delete error')
                                    load()
                                }
                            }}
                        >
                        </FilePond>
                    </td>
                    <td><button onClick={() => this.onSaveClick(index, review.trip_id, review.transaction_id)} className="btn btn-dark">Save</button></td>
                </tr>
            )
        })
    }

    onEditClick = (reviewId) => {
        axios.patch(
            URL_API + `reviews/${reviewId}`, {
                review_title: '',
                review_content: '',
                star: ''
            }
        ).then(res => {
            this.getCompletedReviewsData()
        })
    }

    completedReviewList = () => {
        return this.state.completedReviews.map((review, index) => {
            return (
                <tr key={index}>
                    <td>{review.trip_name}</td>
                    <td>{review.star}</td>
                    <td>{review.review_title}</td>
                    <td>{review.review_content}</td>
                    <td>{this.reviewPictureList(review.pictures)}</td>
                    <td><button onClick={() => this.onEditClick(review.review_id)} className="btn btn-dark">Edit</button></td>
                </tr>
            )
        })
    }

    reviewPictureList = (pictures) => {
        return pictures.map((picture, index) => {
            if(picture){
                return (
                    <img src={URL_API + 'files/review/' + picture} alt={index} key={index} width="150"/>
                )
            } else {
                return null
            }
        })
    }

    render() {
        console.log(this.state.files)
        console.log(this.state.pictures)
        return (
            <div>
                <Header/>
                <div className="container container-height">
                    <div className="row pt-5">
                        <div className="col-12">
                            <Tabs defaultActiveKey="awaitingReview" id="uncontrolled-tab-example">
                                <Tab eventKey="awaitingReview" title="Awaiting Review">
                                    <div className="table-responsive">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Trip Name</th>
                                                    <th>Total Payment</th>
                                                    <th>Order Date</th>
                                                    <th>Star</th>
                                                    <th>Review Title</th>
                                                    <th>Review Content</th>
                                                    <th>Picture</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {this.pendingReviewList()}
                                            </tbody>
                                        </table>
                                    </div>
                                </Tab>
                                <Tab eventKey="yourReview" title="Your Review">
                                    <div className="table-responsive">
                                        <table className="table">
                                            <thead>
                                                <tr>
                                                    <th>Trip Name</th>
                                                    <th>Star</th>
                                                    <th>Review Title</th>
                                                    <th>Review Content</th>
                                                    <th>Pictures</th>
                                                    <th>Action</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {this.completedReviewList()}
                                            </tbody>
                                        </table>
                                    </div>
                                </Tab>
                            </Tabs>
                        </div>
                    </div>
                </div>
                <Footer/>
            </div>
        )
    }
}

const mapStateToProps = (state) => {
    return {
        userId: state.auth.userId
    }
}

export default connect(mapStateToProps)(Review)