import React, { Component } from 'react'
import { connect } from 'react-redux'
// import io from "this.props.socket.io-client";
import Peer from "peerjs";
// import { this.props.socket } from '../../util/this.props.socket';

class VideoStream extends Component {
  constructor(props) {
    super(props);
    this.connectToNewUser = this.connectToNewUser.bind(this);
    this.addVideoStream = this.addVideoStream.bind(this);
    this.toggleVideo = this.toggleVideo.bind(this);
    this.toggleAudio = this.toggleAudio.bind(this);
    this.leaveThePage = this.leaveThePage.bind(this);
    this.componentCleanup = this.componentCleanup.bind(this);

    this.state = {
      peers: {},
      videos: {},
      myVideoMuted: true,
      myAudioMuted: true,
      participants: {}
    }

  }
  componentWillUnmount() {
    // window.removeEventListener("beforeunload", this.leaveThePage);
    // console.log('unmounting');
    this.componentCleanup();

  }

  leaveThePage(e) {
    const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
    if (isFirefox) {
      console.log('client on firefox');

      // e.preventDefault();
      // e.returnValue = "hey";
    }
    console.log('reloading page and disconnecting user');
    this.componentCleanup();
    // alert("you are about to lose connection")
    // const msg = "wtf"
    // return msg
    // this.componentCleanup();
    if (isFirefox) {
      e.returnValue = "hey";
      // return null;
    }
  }

  async componentCleanup() {
    console.log('USER IS GOING TO DISCONNECT');

    window.removeEventListener("beforeunload", this.leaveThePage);
    await this.props.socket.emit("user-disconnected", { userId: this.props.userId, streamId: this.myVideoStream.id, groupId: this.props.groupId })
    this.myVideoStream.getTracks().forEach(track => track.stop());
    // this.props.socket.close();
    // console.log(`this.state.videos before unloading: `, this.state.videos);
    // console.log(`this.state.peers: `, this.state.peers);
  }


  componentDidMount() {
    window.addEventListener("beforeunload", this.leaveThePage);
    // console.log(`this.props.participants: `, this.props.participants);

    // this.this.props.socket = io();
    // this.this.props.socket = this.props.socket;
    // this.this.props.socket.on("send-peer-data", (data) => {
    //     console.log(`data which is sent to new user: `, data);

    //   })
    this.peer = new Peer({
      path: "/",
      port: 443,
      secure: true,
      debug: 0,
    });
    navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true,
    })
      .then((stream) => {
        this.myVideoStream = stream;
        // console.log('going to add own video');
        this.myVideoStream.getVideoTracks()[0].enabled = false;
        this.myVideoStream.getAudioTracks()[0].enabled = false;

        const newParticipants = Object.assign({}, this.state.participants);
        newParticipants[this.myVideoStream.id] = this.props.handle
        this.setState({
          participants: newParticipants
        })

        this.addVideoStream(this.myVideoStream);
        this.peer.on("call", (call) => {

          call.answer(stream);
          console.log('in call');
          // console.log(`call peer on call: `, call);

          call.on("stream", (userVideoStream) => {
            console.log('call answered, streaming');
            const newPeers = Object.assign({}, this.state.peers);
            newPeers[userVideoStream.id] = call;
            this.setState({
              peers: newPeers,
            })

            this.addVideoStream(userVideoStream);

          });
        });

        this.props.socket.on("user-connected", (data) => {
          console.log('in user-connected sending my stream back to them');
          console.log(`this.myVideoStream.id: `, this.myVideoStream.id);
          console.log(`stream.id: `, stream.id);
          const newParticipants = Object.assign({}, this.state.participants);
          newParticipants[data.streamId] = data.handle
          this.setState({
            participants: newParticipants
          })
          // if (data.userId === this.props.userId) {

          this.connectToNewUser(data.id, this.myVideoStream);
          console.log('connected user, sending all participants data');
          this.props.socket.emit("send-peer-data", {
            groupId: this.props.groupId,
            participants: this.state.participants
          })
          // } else {
          //   this.connectToNewUser(data.id, stream, data.userId)

          // }
        });
        this.props.socket.on("send-peer-data", data => {
          const newParticipants = Object.assign({}, this.state.participants);
          Object.keys(data.participants).forEach(streamId => {
            newParticipants[streamId] = data.participants[streamId]

          });
          this.setState({
            participants: newParticipants
          })
        })

        this.props.socket.on("user-disconnected", (data) => {
          console.log(`streamId disconnecting: `, data.streamId);
          // delete newVideos[data.streamId]
          // this.setState({ videos: newVideos })
          // console.log('going to close user ');
          if (this.state.peers[data.streamId]) {
            this.state.peers[data.streamId].close(data.streamId);
          }
          const newPeers = Object.assign({}, this.state.peers);
          const newVideos = Object.assign({}, this.state.videos);
          const newParticipants = Object.assign({}, this.state.participants);

          delete newParticipants[data.streamId]
          delete newPeers[data.streamId]
          Object.keys(this.state.videos).forEach(peerId => {
            if (peerId !== this.myVideoStream.id) {
              if (!newPeers[peerId]) {
                delete newVideos[peerId]
              }
            }
          });
          this.setState({
            peers: newPeers,
            videos: newVideos,
            participants: newParticipants
          })
        });

        this.peer.on("open", (id) => {
          // console.log('joining room');
          // this.roomId = id;
          this.props.socket.emit("join-room", {
            groupId: this.props.groupId,
            userId: this.props.userId,
            id,
            streamId: this.myVideoStream.id,
            handle: this.props.handle
          });
        });
      },
        err => {
          console.log(err);
          alert("Your camera is busy with some other app or software")
        });



  }

  connectToNewUser(id, stream) {
    console.log(`stream.id we are connecting: `, stream.id);
    // console.log(`userId we are connecting: `, userId);
    // console.log(`this.myVideoStream connecting to new user: `, this.myVideoStream);
    // console.log(`id: `, id);

    const call = this.peer.call(id, stream);
    call.on("stream", (userVideoStream) => {
      console.log('I have answered call and received stream ', userVideoStream.id);

      this.addVideoStream(userVideoStream);
      const newPeers = Object.assign({}, this.state.peers);
      newPeers[userVideoStream.id] = call;
      this.setState({
        peers: newPeers
      })

    });
    call.on("close", (streamId) => {
      console.log('in closing peer connection ', streamId);
      // const newPeers = Object.assign({}, this.state.peers);
      // delete newPeers[streamId]
      // const newVideos = Object.assign({}, this.state.videos);
      // Object.keys(this.state.videos).forEach(peerId => {
      //   if (peerId !== this.myVideoStream.id) {
      //     if(!newPeers[peerId]) {
      //       delete newVideos[peerId]
      //     }
      //   }
      // });
      // this.setState({
      //   peers: newPeers,
      //   videos: newVideos
      // })
      // let newVideos = Object.assign({}, this.state.videos);
      // delete newVideos[streamId]
      // this.setState({ videos: newVideos })
    });
    // console.log(`this.peer: `, this.peer);

  }



  addVideoStream(stream) {
    // console.log('adding user stream: ', userId);
    console.log(`stream we are adding to videos: `, stream.id);

    // console.log(`this.props.userId: `, this.props.userId);
    const newVideos = Object.assign({}, this.state.videos);
    newVideos[stream.id] = stream
    this.setState({
      videos: newVideos
    })


  }

  toggleVideo() {
    this.myVideoStream.getVideoTracks()[0].enabled = this.state.myVideoMuted;
    this.setState({
      myVideoMuted: !this.state.myVideoMuted
    })
  }

  toggleAudio() {
    this.myVideoStream.getAudioTracks()[0].enabled = this.state.myAudioMuted;
    this.setState({
      myAudioMuted: !this.state.myAudioMuted
    })
  }



  render() {
    if (!this.myVideoStream) return null;
    if (!this.state.videos[this.myVideoStream.id]) return null;
    console.log(`this.state.videos in render: `, this.state.videos);
    console.log(`this.state.peers in render: `, this.state.peers);
    console.log(`this.state.participants in render: `, this.state.participants);

    const audioMuteBtn = this.state.myAudioMuted ?
      (
        <svg xmlns="http://www.w3.org/2000/svg" fill="white" className="video-icon bi bi-mic-mute-fill" viewBox="0 0 16 16">
          <path d="M13 8c0 .564-.094 1.107-.266 1.613l-.814-.814A4.02 4.02 0 0 0 12 8V7a.5.5 0 0 1 1 0v1zm-5 4c.818 0 1.578-.245 2.212-.667l.718.719a4.973 4.973 0 0 1-2.43.923V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 1 0v1a4 4 0 0 0 4 4zm3-9v4.879L5.158 2.037A3.001 3.001 0 0 1 11 3z" />
          <path d="M9.486 10.607 5 6.12V8a3 3 0 0 0 4.486 2.607zm-7.84-9.253 12 12 .708-.708-12-12-.708.708z" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" fill="white" className="video-icon bi bi-mic-fill" viewBox="0 0 16 16">
          <path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z" />
          <path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z" />
        </svg>
      )
    const videoMuteBtn = this.state.myVideoMuted ? (
      <svg xmlns="http://www.w3.org/2000/svg" fill="white" className="video-icon bi bi-camera-video-off-fill" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M10.961 12.365a1.99 1.99 0 0 0 .522-1.103l3.11 1.382A1 1 0 0 0 16 11.731V4.269a1 1 0 0 0-1.406-.913l-3.111 1.382A2 2 0 0 0 9.5 3H4.272l6.69 9.365zm-10.114-9A2.001 2.001 0 0 0 0 5v6a2 2 0 0 0 2 2h5.728L.847 3.366zm9.746 11.925-10-14 .814-.58 10 14-.814.58z" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" fill="white" className="video-icon bi bi-camera-video-fill" viewBox="0 0 16 16">
        <path fill-rule="evenodd" d="M0 5a2 2 0 0 1 2-2h7.5a2 2 0 0 1 1.983 1.738l3.11-1.382A1 1 0 0 1 16 4.269v7.462a1 1 0 0 1-1.406.913l-3.111-1.382A2 2 0 0 1 9.5 13H2a2 2 0 0 1-2-2V5z" />
      </svg>
    )
    const ownVideo = this.state.videos[this.myVideoStream.id]
    const otherVideos = Object.values(this.state.videos).filter(stream => stream.id !== this.myVideoStream.id);
    return (
      <div id="video-grid">
        <ul>
          <li className="video-first" key={ownVideo.id}>
            <div className="video-icon-container">
              <div className="video-icon-div" onClick={this.toggleVideo}>
                {videoMuteBtn}
              </div>
              <div className="video-icon-div" onClick={this.toggleAudio}>
                {audioMuteBtn}
              </div>
            </div>
            <video className="video-item"
              ref={video => {
                if (video) { video.srcObject = ownVideo }
              }}
              autoPlay={true}
            >
            </video>
            <div className="video-name">
              <p>{this.state.participants[this.myVideoStream.id]}</p>
            </div>
          </li>
          {
            otherVideos.map(stream => {
              return (
                <li key={stream.id}>
                  <video className="video-item"
                    ref={video => {
                      if (video) { video.srcObject = stream }
                    }}
                    autoPlay={true}
                  >
                  </video>
                  <div className="video-name">
                    <p>{this.state.participants[stream.id]}</p>
                  </div>
                </li>
              )
            })
          }
        </ul>
      </div>
    )
  }
}

const mapStateToProps = (state) => ({

})

const mapDispatchToProps = (dispatch) => ({

})

export default connect(mapStateToProps, mapDispatchToProps)(VideoStream)
