import React, {Component} from 'react'
import {
    Alert,
    AppState,
    DeviceEventEmitter,
    Dimensions,
    Image,
    ImageBackground,
    PanResponder,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    

} from 'react-native';
import {RTCView} from 'react-native-webrtc';
import Singleton from "../USerControl/Singleton";
import Global from "../Global";
import {getRemainingime} from "../ScreenUtil";
import IdleTimerManager from "react-native-idle-timer";
import InCallManager from "react-native-incall-manager";
import Orientation from "react-native-orientation";
import Toast from 'react-native-easy-toast'
import {storage} from "../storageUtil";


var {width, height} = Dimensions.get('window')

var IsIOS = Platform.OS === 'ios' ? 1 : 0
var isIphoneX = ((IsIOS) && (height >= 812)) ? 1 : 0
var navigationBarHeight = isIphoneX ? 88 : 64
var stateBar = isIphoneX ? 44 : 20
var ViewPositionTop = stateBar + 10
var bottomHeight = isIphoneX ? 20 : 20
var bottomHeight2 = isIphoneX ? 10 : 10
let sipcall = null;
let videocall = null;
let name = null;
let je = null;
let remoteStream = null;
let isFront = true;
var NativeTest
if (IsIOS) {
    NativeTest  = require('react-native').NativeModules.NativeiOSMethod;
}

export default class componentName extends Component {
    static navigationOptions = {
        tabBarVisible: false, // 隐藏底部导航栏
        header: null,  //隐藏顶部导航栏
    };

    constructor(props) {
        super(props)
        this.state = {
            TimeTxt: '',
            info: 'Initializing',
            status: 'init',
            roomID: '',
            selfViewSrc: null,
            selfViewSrcKey: null,
            remoteList: {},
            remoteListPluginHandle: {},
            remoteViewSrc: null,
            textRoomConnected: false,
            textRoomData: [],
            textRoomValue: '',
            publish: false,
            speaker: false,
            audioMute: false,
            videoMute: false,
            visible: false,
            isAudioOpen: true,
            isSoundOpen: true,
            isVideoOpen: true,
            startTimeStamp: null,
            unmount: false,
            videoImage: require('../icon/ic_videocam_white_48dp.png'),
            audioImage: require('../icon/ic_mic_white_48dp.png'),
            soundImage: require('../icon/ic_volume_up_white_48dp.png'),
            waitShow: '正在等待对方接受邀请...',
            curOrt: 'PORTRAIT',
            showName: '',
            top: 50,
            right: 10,
            showBt: 'flex',
            detailInfo: '',
        }
        this.handleAppStateChange = this.handleAppStateChange.bind(this)
    }

    componentWillMount() {
        AppState.addEventListener('change', this.handleAppStateChange);
        this.state.curOrt = Global.orientationStr;
        IdleTimerManager.setIdleTimerDisabled(true);
        this.panResponder1 = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                this.startHiddenTimer()
                this._top = this.state.top
                this._right = this.state.right
            },
            onPanResponderMove: (evt, gs) => {
                console.log(gs.dx + ' ' + gs.dy)
                this.setState({
                    top: this._top + gs.dy,
                    right: this._right - gs.dx
                })
            },
            onPanResponderRelease: (evt, gs) => {
                this.setState({
                    top: this._top + gs.dy,
                    right: this._right - gs.dx
                })
            }
        })

        this.panResponder2 = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderGrant: () => {
                this.startHiddenTimer()
                console.info("开始计时：")
            },
            onPanResponderMove: (evt, gs) => {
            },
            onPanResponderRelease: (evt, gs) => {
            }
        })
    }

    handleAppStateChange(appState) {
        if (appState == 'active') {
            Orientation.getOrientation((err, orientation) => {
                this.setState({
                    curOrt: orientation
                })
            });
        }
    }

    componentWillUnmount() {
        Global.currentPage = 'CallVC'
        AppState.removeEventListener('change', this.handleAppStateChange);
        Orientation.removeOrientationListener(this._orientationDidChange);
        IdleTimerManager.setIdleTimerDisabled(false);
        this.state.unmount = true;
        if (IsIOS) {
            InCallManager.setKeepScreenOn(false)  
        }
    }

    _orientationDidChange = (ori) => {
        this.setState({
            curOrt: ori
        });
        this.state.top = 50;
        this.state.right = 10;
    }

    startHiddenTimer() {
        if (this.state.showBt == 'none') {
            this.setState({
                showBt: 'flex'
            })
            setTimeout(() => {
                this.setState({
                    showBt: 'none'
                })
            }, 5000)
        }
    }

    componentDidMount() {

        if (IsIOS) {
            InCallManager.setKeepScreenOn(true)  
        }

        this.deEmitter = DeviceEventEmitter.addListener('login', (a) => {
            if (Global.currentPage == 'VideoVC') {
                if (a.indexOf("Lost connection") >= 0 || a.indexOf('server down') >= 0
                    || a.indexOf("Is the gateway down") >= 0 || a.indexOf('already taken') >= 0) {
                    if (this.state.curOrt == 'PORTRAIT') {
                        StatusBar.setHidden(false, 'slide')
                    }
                    console.info("回退")
                    this.props.navigation.goBack()
                }
            }
        });
        Global.currentPage = 'VideoVC'
        if (!Global.isIncomming) {
            InCallManager.startRingback()
        }
        Orientation.addSpecificOrientationListener((specificOrientation) => {

            if (specificOrientation == "LANDSCAPE-LEFT") {
                console.info('===向左旋转了===');
            } else if (specificOrientation == "PORTRAIT") {
                this.setState({
                    curOrt: "PORTRAIT"
                })
            }

        });

        // Orientation.lockToPortrait();
        Orientation.addOrientationListener(this._orientationDidChange);
        let {user_name, jsep} = this.props.navigation.state.params;
        name = user_name;
        if (name.indexOf('@') > 0 && !Global.isIncomming && name.indexOf('sip') < 0) {
            name = 'sip:' + name;
        }
        if (name.startsWith('+') && !Global.isIncomming) {
            storage.load("ip", (PhoneNumber) => {
                if (PhoneNumber.length > 0) {
                    name = 'sip:' + name.substring(1) + '@' + PhoneNumber;
                }
            })
        }
        je = jsep;
        let interval = setInterval(() => {
            if (this.state.startTimeStamp != null) {
                if (this.state.unmount) {
                    clearInterval(interval)
                    return;
                }
                const currentTimestamp = new Date().getTime();
                let remainingime = getRemainingime(currentTimestamp, this.state.startTimeStamp);
                let hour = remainingime[3];
                let min = remainingime[4];
                let second = remainingime[5];

                let time = null;
                if (hour == '00') {
                    if (min == '00') {
                        time = '00:' + second
                    } else {
                        time = min + ":" + second
                    }
                } else {
                    time = hour + ":" + min + ":" + second
                }
                this.setState({TimeTxt: time});
            }
        }, 1000);

        let single = new Singleton
        sipcall = single.getSipcall()
        videocall = single.getVideoCall()
        if (Global.isSip) {
            if (Global.isIncomming) {
                let offerlessInvite = false;
                if (je !== null && je !== undefined) {
                } else {
                    offerlessInvite = true;
                }
                try {
                    let sipcallAction = (offerlessInvite ? sipcall.createOffer : sipcall.createAnswer);
                    sipcallAction(
                        {
                            jsep: je,
                            media: {
                                audioSend: true, audioRecv: true,		// We DO want audio
                                videoSend: true, videoRecv: true,	// We MAY want video
                            },
                            success: function (jsep) {
                                let body = {request: "accept"};
                                sipcall.send({"message": body, "jsep": jsep});
                            },
                            error: function (error) {
                                // Janus.error("WebRTC error:", error);
                                // Don't keep the caller waiting any longer, but use a 480 instead of the default 486 to clarify the cause
                                var body = {"request": "decline", "code": 480};
                                sipcall.send({"message": body});
                            }
                        });
                        
                } catch (e) {

                }
            } else {
                try {
                    sipcall.createOffer(
                        {
                            media: {
                                audioSend: true, audioRecv: true,		// We DO want audio
                                videoSend: true, videoRecv: true	// We MAY want video
                            },
                            success: function (jsep) {
                                 if (IsIOS) {  
                                     NativeTest.doSomething(jsep.sdp)
                                    jsep.sdp  = jsep.sdp.replace("m=video 9 UDP/TLS/RTP/SAVPF 96 97 98 99 100 101 127 123 125 122 124","m=video 9 UDP/TLS/RTP/SAVPF 100 101 127 123 125 122 124")
                                    jsep.sdp  = jsep.sdp.replace("a=rtpmap:96 H264/90000","")
                                    jsep.sdp  = jsep.sdp.replace("a=rtcp-fb:96 goog-remb","")
                                    jsep.sdp  = jsep.sdp.replace("a=rtcp-fb:96 transport-cc","")
                                    jsep.sdp  = jsep.sdp.replace("a=rtcp-fb:96 ccm fir","")
                                    jsep.sdp  = jsep.sdp.replace("a=rtcp-fb:96 nack","")
                                    jsep.sdp  = jsep.sdp.replace("a=rtcp-fb:96 nack pli","")
                                    jsep.sdp  = jsep.sdp.replace("a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c33","")
                                    jsep.sdp  = jsep.sdp.replace("a=rtpmap:97 rtx/90000","")
                                    jsep.sdp  = jsep.sdp.replace("a=fmtp:97 apt=96","")
                                    jsep.sdp  = jsep.sdp.replace("a=rtpmap:98 H264/90000","")
                                    jsep.sdp  = jsep.sdp.replace("a=rtpmap:97 rtx/90000","")
                                    jsep.sdp  = jsep.sdp.replace("a=rtcp-fb:98 goog-remb","")
                                    jsep.sdp  = jsep.sdp.replace("a=rtcp-fb:98 transport-cc","")
                                    jsep.sdp  = jsep.sdp.replace("a=rtcp-fb:98 ccm fir","")
                                    jsep.sdp  = jsep.sdp.replace("a=rtcp-fb:98 nack","")
                                    jsep.sdp  = jsep.sdp.replace("a=rtcp-fb:98 nack pli","")
                                    jsep.sdp  = jsep.sdp.replace("a=fmtp:96 level-asymmetry-allowed=1;packetization-mode=1;profile-level-id=640c33","")
                                    jsep.sdp  = jsep.sdp.replace("a=rtpmap:99 rtx/90000","")
                                    jsep.sdp  = jsep.sdp.replace("a=fmtp:99 apt=98","")
                                } 
                               
                                let body = {request: "call", uri: name};
                                sipcall.send({"message": body, "jsep": jsep});
                            },
                            error: function (error) {
                                console.info("sip createoffer error" + error.toString())
                            }
                        });
                } catch (e) {
                }
            }
        } else {
            if (Global.isIncomming) {
                try {
                    videocall.createAnswer(
                        {
                            jsep: je,
                            // No media provided: by default, it's sendrecv for audio and video
                            media: {
                                audioSend: true, audioRecv: true,		// We DO want audio
                                videoSend: true, videoRecv: true	// We MAY want video
                            },	// Let's negotiate data channels as well
                            // If you want to test simulcasting (Chrome and Firefox only), then
                            // pass a ?simulcast=true when opening this demo page: it will turn
                            // the following 'simulcast' property to pass to janus.js to true
                            simulcast: false,
                            success: function (jsep) {
                                let body = {"request": "accept"};
                                videocall.send({"message": body, "jsep": jsep});
                            },
                            error: function (error) {
                            }
                        });
                } catch (e) {
                }
            } else {
                try {
                    videocall.createOffer(
                        {
                            media: {
                                audioSend: true, audioRecv: true,		// We DO want audio
                                videoSend: true, videoRecv: true	// We MAY want video
                            },
                            simulcast: false,
                            success: function (jsep) {
                                let body = {"request": "call", "username": name};
                                videocall.send({"message": body, "jsep": jsep});
                            },
                            error: function (error) {
                            }
                        });
                } catch (e) {
                }
            }
        }

        
            var internalFunc = function(sdp,codec) {
                var codecre = new RegExp('(a=rtpmap:(\\d*) ' + codec + '\/90000\\r\\n)');
                var rtpmaps = sdp.match(codecre);
                if (rtpmaps == null || rtpmaps.length <= 2) {
                    return sdp;
                }
                var rtpmap = rtpmaps[2];
                // var modsdp = sdp.replace(codecre, "");​
                var modsdp = sdp.replace(codecre, "");
                var rtcpre = new RegExp('(a=rtcp-fb:' + rtpmap + '.*\r\n)', 'g');
                //  modsdp = modsdp.replace(rtcpre, "");​
                modsdp = modsdp.replace(rtcpre, "");
                var fmtpre = new RegExp('(a=fmtp:' + rtpmap + '.*\r\n)', 'g');
                //    modsdp = modsdp.replace(fmtpre, "");​
                modsdp = modsdp.replace(fmtpre, "");
                var aptpre = new RegExp('(a=fmtp:(\\d*) apt=' + rtpmap + '\\r\\n)');
                var aptmaps = modsdp.match(aptpre);
                var fmtpmap = "";
                if (aptmaps != null && aptmaps.length >= 3) {
                    fmtpmap = aptmaps[2];
                    // modsdp = modsdp.replace(aptpre, "");​
                    modsdp = modsdp.replace(aptpre, "");
                    var rtppre = new RegExp('(a=rtpmap:' + fmtpmap + '.*\r\n)', 'g');
                    modsdp = modsdp.replace(rtppre, "");
                }
                var videore = /(m=video.*\r\n)/;
                var videolines = modsdp.match(videore);
                if (videolines != null) {
                    //If many m=video are found in SDP, this program doesn't work.
                    var videoline = videolines[0].substring(0, videolines[0].length - 2);
                    var videoelem = videoline.split(" ");
                    var modvideoline = videoelem[0];
                    for (var i = 1; i < videoelem.length; i++) {
                        if (videoelem[i] == rtpmap || videoelem[i] == fmtpmap) {
                            continue;
                        }
                        modvideoline += " " + videoelem[i];
                    }
                    modvideoline += "\r\n";
                    modsdp = modsdp.replace(videore, modvideoline);
                }
                return internalFunc(modsdp);
            };
        
        this.deEmitter = DeviceEventEmitter.addListener('onmessage', (msg, jsep) => {
            if (this.state.unmount) {
                return;
            }
            let result = msg["result"];
            if (result !== null && result !== undefined) {
                let event = result["event"];
                if (event !== undefined && event !== null) {
                    if (event === 'calling') {
                        Global.isCalling = true;
                        console.info("拨打号码中......")
                    } else if (event === 'accepted') {
                        InCallManager.stopRingback()
                        InCallManager.setSpeakerphoneOn(true)
                        this.state.startTimeStamp = new Date().getTime();
                        Global.isCalling = true;
                        if (Global.isSip) {
                            if (jsep !== null && jsep !== undefined) {
                                if (IsIOS) {
                                 
                                }
                               
                                sipcall.handleRemoteJsep({
                                    jsep: jsep, error: function () {
                                        doHangup()
                                    }
                                });   
                            }
                        } else {
                            if (jsep)
                           
                                videocall.handleRemoteJsep({jsep: jsep});
                        }

                        this.setState({
                            waitShow: ''
                        })
                        setTimeout(() => {
                            this.setState({
                                showBt: 'none'
                            })
                        }, 5000)
                    } else if (event === 'hangup') {
                        let b = msg["videocall"] == null;
                        let contains = name.indexOf('sip') >= 0;
                        if (b == contains) {
                            InCallManager.stopRingback()
                            doHangup()
                            if (this.state.curOrt == 'PORTRAIT') {
                                StatusBar.setHidden(false, 'slide')
                            }
                            this.props.navigation.goBack()
                        }
                    } else if (event === 'incomingcall') {
                        let username = result["username"];
                    }
                }
            }
        });
        this.deEmitter = DeviceEventEmitter.addListener('error', (error) => {
            if (this.state.unmount) {
                return;
            }
            InCallManager.stopRingback()
            if (this.state.curOrt == 'PORTRAIT') {
                StatusBar.setHidden(false, 'slide')
            }
            this.props.navigation.goBack()
        });
        this.deEmitter = DeviceEventEmitter.addListener('onlocalstream', (stream) => {
            if (this.state.unmount) {
                return;
            }
            let videoTracks = stream.getVideoTracks();
            if (videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
            } else {
                this.setState({selfViewSrc: stream.toURL()});
            }
        });
        this.deEmitter = DeviceEventEmitter.addListener('onremotestream', (stream) => {
            if (this.state.unmount) {
                return;
            }
            remoteStream = stream;
            let videoTracks = stream.getVideoTracks();
            if (videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
            } else {
                this.setState({remoteViewSrc: stream.toURL()});
            }
            InCallManager.setSpeakerphoneOn(true)
            if (Global.isSip) {
                const _this = this;
                let interval = setInterval(() => {
                    if (this.state.unmount) {
                        clearInterval(interval)
                        return;
                    }
                    sipcall.getVideoInfo({
                        success: function (data) {
                            var info = "";
                            var height = "";
                            var width = "";
                            for (let i = 0; i < data.length; i++) {
                                let datum = data[i];
                                let height11 = datum['googFrameHeightReceived'];
                                let width11 = datum['googFrameWidthReceived'];
                                if (height11 !== undefined) {
                                    height = height11;
                                } else if (width11 !== undefined) {
                                    width = width11;
                                }
                                let s = JSON.stringify(datum) + "\n";
                                info += s;
                            }
                            _this.setState({detailInfo: info, showName: width + "x" + height});
                        },
                    });
                }, 1000);
            } else {
                const _this = this;
                let interval = setInterval(() => {
                    if (this.state.unmount) {
                        clearInterval(interval)
                        return;
                    }
                    videocall.getVideoInfo({
                        success: function (data) {
                            var info = "";
                            var height = "";
                            var width = "";
                            for (let i = 0; i < data.length; i++) {
                                let datum = data[i];
                                let height11 = datum['googFrameHeightReceived'];
                                let width11 = datum['googFrameWidthReceived'];

                                if (height11 !== undefined) {
                                    height = height11;
                                } else if (width11 !== undefined) {
                                    width = width11;
                                }
                                let s = JSON.stringify(datum) + "\n";
                                info += s;
                            }
                            _this.setState({detailInfo: info, showName: height + "x" + width});
                        },
                    });
                }, 1000)
            }
        });
        this.deEmitter = DeviceEventEmitter.addListener('login', (a) => {
                if (this.state.unmount) {
                    return;
                }
                if (a != 'success') {
                    InCallManager.stopRingback()
                    doHangup()
                    if (this.state.curOrt == 'PORTRAIT') {
                        StatusBar.setHidden(false, 'slide')
                    }
                    this.props.navigation.goBack()
                }
            }
        );
        StatusBar.setHidden(true, 'slide')
    };

    render() {
        let v = this.state.isVideoOpen ?
            <RTCView {...this.panResponder1.panHandlers} zOrder={1} streamURL={this.state.selfViewSrc}
                     style={(this.state.curOrt == 'PORTRAIT') ? {
                         top: this.state.top,
                         right: this.state.right,
                         position: "absolute",
                         width: height > width ? width / 3 : height / 3,
                         height: height > width ? height / 4 : height / 4,
                     } : {
                         top: this.state.top,
                         right: this.state.right,
                         position: "absolute",
                         width: height > width ? height / 5 : width / 5,
                         height: height > width ? width / 3 : height / 3,
                     }}/> : null;

        return (
            <View style={{flex: 1, alignItems: 'center', backgroundColor: 'black'}}>
                {/*<StatusBar backgroundColor="#ff0000"*/}
                {/*           translucent={true}*/}
                {/*           hidden={true}*/}
                {/*           animated={true}/>*/}
                <ImageBackground source={require('../icon/back.png')}
                                 style={(this.state.curOrt == 'PORTRAIT') ? styles.ViewStyle2 : styles2.ViewStyle2}>

                    <View style={(this.state.curOrt == 'PORTRAIT') ? styles.VideoBackStyle : styles2.VideoBackStyle}>

                        <RTCView  {...this.panResponder2.panHandlers} zOrder={0} mirror = {false} streamURL={this.state.remoteViewSrc}
                                  style={(this.state.curOrt == 'PORTRAIT') ? styles.selfView : styles2.selfView}
                        />
                    </View>
                    {v}
                    <View
                        style={(this.state.curOrt == 'PORTRAIT') ? styles.TopStyle : styles2.TopStyle}>
                        <View style={(this.state.curOrt == 'PORTRAIT') ? {
                            position: "absolute", width: height > width ? width : height,
                        } : {
                            position: "absolute", width: height > width ? height : width,
                        }}>


                            <TouchableOpacity
                                onPress={() => {
                                    Alert.alert(
                                        '详细信息',
                                        this.state.detailInfo,
                                        [
                                            {text: '确定', onPress: () => console.log('Ask me later pressed')}
                                        ],
                                        {cancelable: false}
                                    );
                                }}
                            >
                                <Text style={[styles.TitleStyle, {display: this.state.showBt}]}>视频通话</Text>
                            </TouchableOpacity>


                            <Text style={{
                                fontSize: 16,
                                justifyContent: 'center',
                                color: 'white',
                                textAlign: 'center',
                                display: this.state.showBt,
                            }}>{this.state.showName}</Text>
                            <Text style={{
                                fontSize: 16,
                                justifyContent: 'center',
                                color: 'white',
                                textAlign: 'center',
                                display: this.state.showBt,
                            }}>{this.state.TimeTxt}</Text>
                        </View>

                        <View style={{
                            position: "absolute",
                            right: 0,
                        }}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (Global.isSip) {
                                        this.refs.toast.show('切换前置摄像头');
                                        sipcall.changeLocalCamera(isFront);
                                        isFront = !isFront;
                                    } else {
                                        this.refs.toast.show('切换后置摄像头');
                                        videocall.changeLocalCamera(isFront);
                                        isFront = !isFront;
                                    }
                                }}
                            >
                                <Image source={require('../icon/switch_camera.png')}
                                       style={{
                                           height: 40,
                                           width: 40,
                                           marginTop: 10,
                                           marginEnd: 10,
                                           display: this.state.showBt,
                                       }}/>
                            </TouchableOpacity>
                        </View>
                    </View>
                    {/*<Text style={{*/}
                    {/*    height: height,*/}
                    {/*    width: width,*/}
                    {/*    textAlign: 'center',*/}
                    {/*    alignItems: 'center',*/}
                    {/*    justifyContent: 'center',*/}
                    {/*    textAlignVertical: 'center',*/}
                    {/*    fontSize: 20,*/}
                    {/*    color: 'white',*/}
                    {/*}}>{this.state.waitShow}</Text>*/}
                    <View
                        style={(this.state.curOrt == 'PORTRAIT') ? styles.BottomView : styles2.BottomView}>
                        <TouchableOpacity
                            onPress={() => {
                                if (Global.isSip) {
                                    if (this.state.isAudioOpen) {
                                        this.refs.toast.show('关闭麦克风');
                                        sipcall.muteAudio()
                                        this.state.isAudioOpen = false
                                        this.setState({
                                            audioImage: require('../icon/ic_mic_off_white_48dp.png')
                                        })
                                    } else {
                                        this.refs.toast.show('打开麦克风');
                                        sipcall.unmuteAudio()
                                        this.state.isAudioOpen = true
                                        this.setState({
                                            audioImage: require('../icon/ic_mic_white_48dp.png')
                                        })
                                    }
                                } else {
                                    if (this.state.isAudioOpen) {
                                        this.refs.toast.show('关闭麦克风');
                                        videocall.muteAudio()
                                        this.state.isAudioOpen = false
                                        this.setState({
                                            audioImage: require('../icon/ic_mic_off_white_48dp.png')
                                        })
                                    } else {
                                        this.refs.toast.show('打开麦克风');
                                        videocall.unmuteAudio()
                                        this.state.isAudioOpen = true
                                        this.setState({
                                            audioImage: require('../icon/ic_mic_white_48dp.png')
                                        })
                                    }
                                }
                            }}
                        >
                            <View style={{
                                justifyContent: 'center', display: this.state.showBt,
                            }}>
                                <Image source={this.state.audioImage} style={{
                                    marginLeft: 30,
                                    marginRight: 10,
                                    width: 45,
                                    height: 45,
                                }}/>
                                <Text style={(this.state.curOrt == 'PORTRAIT') ? {
                                    marginLeft: 20,
                                    textAlign: 'center',
                                    marginTop: 5,
                                    color: '#fff',
                                } : {
                                    marginLeft: 20,
                                    textAlign: 'center',
                                    marginTop: 2,
                                    color: '#fff',
                                }}>麦克风</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                if (Global.isSip) {
                                    if (this.state.isSoundOpen) {
                                        this.refs.toast.show('关闭扬声器');
                                        this.state.isSoundOpen = false
                                        this.setState({
                                            soundImage: require('../icon/ic_volume_off_white_48dp.png')
                                        })
                                        let trackById = remoteStream.getTrackById('janusa0');
                                        trackById.enabled = false;
                                    } else {
                                        this.refs.toast.show('打开扬声器');
                                        this.state.isSoundOpen = true
                                        this.setState({
                                            soundImage: require('../icon/ic_volume_up_white_48dp.png')
                                        })
                                        let trackById = remoteStream.getTrackById('janusa0');
                                        trackById.enabled = true;
                                    }
                                } else {
                                    if (this.state.isSoundOpen) {
                                        this.refs.toast.show('关闭扬声器');
                                        this.state.isSoundOpen = false
                                        this.setState({
                                            soundImage: require('../icon/ic_volume_off_white_48dp.png')
                                        })
                                        let trackById = remoteStream.getTrackById('janusa0');
                                        trackById.enabled = false;
                                    } else {
                                        this.refs.toast.show('打开扬声器');
                                        this.state.isSoundOpen = true
                                        this.setState({
                                            soundImage: require('../icon/ic_volume_up_white_48dp.png')
                                        })
                                        let trackById = remoteStream.getTrackById('janusa0');
                                        trackById.enabled = true;
                                    }
                                }
                            }}
                        >
                            <View style={{
                                justifyContent: 'center', display: this.state.showBt,
                            }}>
                                <Image source={this.state.soundImage} style={styles.BottomIcon}/>
                                <Text
                                    style={(this.state.curOrt == 'PORTRAIT') ? styles.TextStyle : styles2.TextStyle}>扬声器</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                if (Global.isSip) {
                                    if (this.state.isVideoOpen) {
                                        this.refs.toast.show('关闭本地摄像头');
                                        this.state.isVideoOpen = false;
                                        sipcall.muteVideo()
                                        this.setState({
                                            videoImage: require('../icon/ic_videocam_off_white_48dp.png')
                                        })
                                    } else {
                                        this.refs.toast.show('打开本地摄像头');
                                        this.state.isVideoOpen = true;
                                        sipcall.unmuteVideo()

                                        this.setState({
                                            videoImage: require('../icon/ic_videocam_white_48dp.png')
                                        })
                                    }
                                } else {
                                    if (this.state.isVideoOpen) {
                                        this.refs.toast.show('关闭本地摄像头');
                                        this.state.isVideoOpen = false;
                                        videocall.muteVideo()
                                        this.setState({
                                            videoImage: require('../icon/ic_videocam_off_white_48dp.png')
                                        })
                                    } else {
                                        this.refs.toast.show('打开本地摄像头');
                                        this.state.isVideoOpen = true;
                                        videocall.unmuteVideo()
                                        this.setState({
                                            videoImage: require('../icon/ic_videocam_white_48dp.png')
                                        })
                                    }
                                }
                            }}>
                            <View style={{
                                justifyContent: 'center', display: this.state.showBt,
                            }}>
                                <Image source={this.state.videoImage} style={styles.BottomIcon}/>
                                <Text
                                    style={(this.state.curOrt == 'PORTRAIT') ? styles.TextStyle : styles2.TextStyle}>摄像头</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                InCallManager.stopRingback()
                                let hangup = {"request": "hangup"};
                                if (Global.isSip) {
                                    sipcall.send({"message": hangup});
                                } else {
                                    videocall.send({"message": hangup});
                                }
                                doHangup()
                                if (this.state.curOrt == 'PORTRAIT') {
                                    StatusBar.setHidden(false, 'slide')
                                }
                                this.props.navigation.goBack()
                            }}
                        >
                            <View style={{
                                justifyContent: 'center', display: this.state.showBt,
                            }}>
                                <Image source={require('../icon/hangup_call.png')} style={{
                                    marginLeft: 10,
                                    marginRight: 30,
                                    width: 45,
                                    height: 45,
                                }}/>
                                <Text style={(this.state.curOrt == 'PORTRAIT') ? {
                                    marginRight: 20,
                                    textAlign: 'center',
                                    marginTop: 5,
                                    color: '#fff',
                                } : {
                                    marginRight: 20,
                                    textAlign: 'center',
                                    marginTop: 2,
                                    color: '#fff',
                                }}>挂断</Text>
                            </View>

                        </TouchableOpacity>
                    </View>
                    <Toast ref="toast" fadeOutDuration={0}/>
                </ImageBackground>
            </View>
        )
    }
}

const styles = StyleSheet.create({
    ViewStyle2: {
        width: height > width ? width : height,
        height: height > width ? height : width,
        alignItems: 'center',
    },
    TopStyle: {
        position: "absolute",
        flexDirection: 'row',
        width: height > width ? width : height,
        height: 70,
        marginTop: isIphoneX ? 20 : 0
    },
    VideoBackStyle: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'transparent'
    },
    BackStyle: {
        backgroundColor: '#CDCDCD',
        width: 60,
        height: 35,
        marginLeft: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    backIcon: {
        width: 25,
        height: 25,
    },
    TitleStyle: {
        textAlign: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        fontSize: 18,
        color: 'white',
        ...Platform.select({
            ios: {
                lineHeight: 50,
            },
            android: {
                marginTop: 10,
            }
        })
    },
    Reloation: {
        width: 40,
        height: 40,
    },
    BottomView: {
        flex: 1,
        alignItems: 'center',
        // backgroundColor: '#666',
        width: height > width ? width : width / 4,
        height: 70,
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        bottom: bottomHeight,
    },
    BottomIcon: {
        marginLeft: 10,
        marginRight: 10,
        width: 45,
        height: 45,
    },
    TextStyle: {
        textAlign: 'center',
        marginTop: 5,
        color: '#fff',
    },
    selfView: {
        ...Platform.select({
            ios: {
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
            },
            android: {
                position: "absolute",
                width: height > width ? width : height,
                height: height > width ? height : width,
            }
        })
    },
})

const styles2 = StyleSheet.create({
    ViewStyle2: {
        width: height > width ? height : width,
        height: height > width ? width : height,
        alignItems: 'center',
    },
    TopStyle: {
        position: "absolute",
        flexDirection: 'row',
        width: height > width ? height : width,
        height: 70,
        marginTop: isIphoneX ? 20 : 0
    },
    VideoBackStyle: {
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: 'black'
    },
    BackStyle: {
        backgroundColor: '#CDCDCD',
        width: 60,
        height: 35,
        marginLeft: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    backIcon: {
        width: 25,
        height: 25,
    },
    TitleStyle: {
        paddingTop: 10,
        textAlign: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        fontSize: 18,
        color: 'white',
        ...Platform.select({
            ios: {
                lineHeight: 50,
            }
        })
    },
    Reloation: {
        width: 40,
        height: 40,
    },
    BottomView: {
        flex: 1,
        alignItems: 'center',
        width: height > width ? width : width / 4,
        height: 70,
        flexDirection: 'row',
        justifyContent: 'space-between',
        position: 'absolute',
        bottom: bottomHeight2,
    },
    BottomIcon: {
        marginLeft: 10,
        marginRight: 10,
        width: 45,
        height: 45,
    },
    TextStyle: {
        textAlign: 'center',
        marginTop: 2,
        color: '#fff',
    },
    selfView: {

        ...Platform.select({
            ios: {
                backgroundColor: 'black',
                position: "absolute",
                top: 0,
                left: isIphoneX ? 30 : 0,
                bottom: 0,
                right: isIphoneX ? 30 : 0,
            },
            android: {
                position: "absolute",
                // backgroundColor: '#00FF40',
                width: height > width ? height : width,
                height: height > width ? width : height,
            }
        })
    },
})

function doHangup() {
    Global.isCalling = false;
    if (Global.isSip) {
        sipcall.hangup();
    } else {
        videocall.hangup();
    }
}

