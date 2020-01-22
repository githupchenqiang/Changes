import React, {Component} from 'react'
import {
    Animated,
    AppState,
    DeviceEventEmitter,
    Dimensions,
    Easing,
    Image,
    ImageBackground,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import Singleton from '../USerControl/Singleton'
import Toast from 'react-native-easy-toast'
import Global from "../Global";
import IdleTimerManager from "react-native-idle-timer";
import InCallManager from "react-native-incall-manager";
import Orientation from 'react-native-orientation';
import {storage} from "../storageUtil";

var {width, height} = Dimensions.get('window')
var TimerMixin = require('react-timer-mixin');
var IsIOS = Platform.OS === 'ios' ? 1 : 0
var isIphoneX = ((IsIOS) && (height >= 812)) ? 1 : 0
var navigationBarHeight = isIphoneX ? 88 : 64
var stateBar = isIphoneX ? 44 : 20
var ViewPositionTop = stateBar + 10
var bottomHeight = isIphoneX ? 30 : 10
var ToUsername
let sfutest = null;
let sipCall = null
var audioEnable = true
var speakerAudio = false
var videoEnable = true
var ISAudioSession = true
let isSipCall = false
var commingjsp = null;
var remoteStream;
let TabIcon = [require('../icon/animate/speaker1.png'), require('../icon/animate/speaker2.png'), require('../icon/animate/speaker3.png')];

export default class componentName extends Component {
    constructor(props) {
        super(props)
        this.state = {
            count: 0,
            timeText: '',
            miuter: 0,
            TimeTxt: '正在连接...',
            publish: false,
            info: 'Initializing',
            status: 'init',
            remoteList: {},
            remoteListPluginHandle: {},
            mainViewSrc: null,
            text: '',
            roomList: [],
            chatList: [],
            audioMute: false,
            videoMute: false,
            speaker: false,
            remoteMute: false,
            currentId: '',
            messages: [],
            ToName: '',
            selfStream: null,
            remoteStram: null,
            Audioimage: require('../icon/ic_mic_white_48dp.png'),
            isClosed: false,
            isSipCall: false,
            SpeakerImage: require('../icon/ic_volume_up_white_48dp.png'),
            unmount: false,
            curOrt: 'PORTRAIT',
            frameValue: new Animated.Value(0),
            imageSource: 0,
        }
        this.handleAppStateChange = this.handleAppStateChange.bind(this)
    }

    _orientationDidChange = (ori) => {
        console.info("切换了" + ori)
        this.setState({
            curOrt: ori
        });
        if (this.state.curOrt == 'PORTRAIT') {
            StatusBar.setHidden(false, 'slide')
        } else {
            StatusBar.setHidden(true, 'slide')
        }
    }

    componentWillMount() {
        AppState.addEventListener('change', this.handleAppStateChange);
        this.state.curOrt = Global.orientationStr;
        IdleTimerManager.setIdleTimerDisabled(true);
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
        this.state.unmount = true;
        IdleTimerManager.setIdleTimerDisabled(false);
        // 如果存在this.timer，则使用clearTimeout清空。
        // 如果你使用多个timer，那么用多个变量，或者用个数组来保存引用，然后逐个clear
        this.timer && clearInterval(this.timer);
        // count = 0;
        // miuter = 0;
        Global.isIncomming = false
        if (IsIOS) {
            InCallManager.setKeepScreenOn(false)  
        }
        
    }

    componentDidMount() {
        if (IsIOS) {
            InCallManager.setKeepScreenOn(true)  
        }
        Global.currentPage = 'AudioVC'
        Orientation.addOrientationListener(this._orientationDidChange);
        if (!Global.isIncomming) {
            InCallManager.startRingback()
        }
        let {user_name, Calljsep, isSip,} = this.props.navigation.state.params;
        ToUsername = user_name;

        if (ToUsername.indexOf('@') > 0 && !Global.isIncomming && ToUsername.indexOf('sip') < 0) {
            ToUsername = 'sip:' + ToUsername;
        }
        if (ToUsername.startsWith('+') && !Global.isIncomming) {
            storage.load("ip", (PhoneNumber) => {
                if (PhoneNumber.length > 0) {
                    ToUsername = 'sip:' + ToUsername.substring(1) + '@' + PhoneNumber;
                }
            })
        }
        isSipCall = isSip
        commingjsp = Calljsep;
        this._StartAudioJanus();
        this.deEmitter = DeviceEventEmitter.addListener('onmessage', (msg, jsep) => {
            if (this.state.unmount) {
                return;
            }
            let result = msg["result"];
            if (result !== null && result !== undefined) {
                let event = result["event"];
                if (event !== undefined && event !== null) {
                    if (event === "calling") {
                    } else if (event === "accepted") {
                        InCallManager.stopRingback()
                        InCallManager.setSpeakerphoneOn(true)
                        this._StartTimer();
                        if (jsep) {
                            if (isSipCall) {
                                sipCall.handleRemoteJsep({
                                    jsep: jsep, error: function () {
                                        sipdoHangup()
                                    }
                                });
                            } else {
                                sfutest.handleRemoteJsep({jsep: jsep});
                            }
                        }
                    } else if (event === 'hangup') {
                        InCallManager.stopRingback()
                        this.doHangup()
                        if (this.state.curOrt == 'PORTRAIT') {
                            StatusBar.setHidden(false, 'slide')
                        } else {
                            StatusBar.setHidden(true, 'slide')
                        }
                        this.props.navigation.goBack()
                    }
                }
            }
            
        });
        this.deEmitter = DeviceEventEmitter.addListener('login', (a) => {
            if (this.state.unmount) {
                return;
            }
            if (a == 'success') {
            } else {
                InCallManager.stopRingback()
                this.doHangup()
                if (this.state.curOrt == 'PORTRAIT') {
                    StatusBar.setHidden(false, 'slide')
                } else {
                    StatusBar.setHidden(true, 'slide')
                }
                this.props.navigation.goBack()
            }
        });
        this.deEmitter = DeviceEventEmitter.addListener('onremotestream', (stream) => {
            InCallManager.setSpeakerphoneOn(true)
            remoteStream = stream
        })
        if (this.state.curOrt == 'LANDSCAPE') {
            StatusBar.setHidden(true, 'slide')
        } else {
            StatusBar.setHidden(false, 'slide')
        }

        
        this._startAnimation(2, 500);

    }

    //时间定时器
    _StartTimer = () => {
        this.timer = setInterval(
            () => {
                this._timeShow();
            },
            1000,
        );
    }
    //声明一个定时器
    _timeShow = () => {
        this.state.count = this.state.count + 1
        if (this.state.count == 60) {
            this.state.miuter = this.state.miuter + 1
            this.state.count = 0
        }
        if (this.state.count >= 10) {
            if (this.state.miuter >= 10) {
                this.state.timeText = this.state.miuter + ':' + this.state.count
            } else {
                this.state.timeText = '0' + this.state.miuter + ':' + this.state.count
            }
        } else {
            if (this.state.miuter >= 10) {
                this.state.timeText = this.state.miuter + ':' + '0' + this.state.count
            } else {
                this.state.timeText = '0' + this.state.miuter + ':' + '0' + this.state.count
            }
        }
        this.setState({
            TimeTxt: this.state.timeText
        })
    }


    doHangup() {
        if (isSipCall) {
            sipCall.hangup();
        } else {
            sfutest.hangup();
        }
    }

    _StartAudioJanus = () => {
        let singleton = new Singleton()
        sfutest = singleton.getVideoCall()
        sipCall = singleton.getSipcall()
        if (isSipCall) {
            if (Global.isIncomming) {
                sipCall.createAnswer({
                    jsep: commingjsp,
                    media: {audio: true, video: false},
                    success: function (jsep) {
                        let body = {request: "accept"};
                        sipCall.send({"message": body, "jsep": jsep});
                    }
                })
            } else {
                sipCall.createOffer(
                    {
                        media: {
                            audioSend: true, audioRecv: true,		// We DO want audio
                            videoSend: false, videoRecv: false	// We MAY want video
                        },
                        success: function (jsep) {
                            var body = {request: "call", uri: ToUsername};
                            sipCall.send({"message": body, "jsep": jsep});
                        },
                        error: function (error) {
                            console.info(error)
                            // console.log("WebRTC error... " + JSON.stringify(error));
                        }
                    });
            }
        } else {
            if (Global.isIncomming) {
                let hasVideo = (commingjsp.sdp.indexOf("m=video ") > -1);
                sfutest.createAnswer(
                    {
                        jsep: commingjsp,
                        media: {
                            // data: true,
                            videoSend: false,
                            videoRecv: false,		// We DO want audio

                        },	// Let's negotiate data channels as well
                        // If you want to test simulcasting (Chrome and Firefox only), then
                        // pass a ?simulcast=true when opening this demo page: it will turn
                        // the following 'simulcast' property to pass to janus.js to true
                        simulcast: false,
                        success: function (jsep) {
                            let body = {"request": "accept"};
                            sfutest.send({"message": body, "jsep": jsep});
                        },
                        error: function (error) {
                        }
                    });

            } else {
                sfutest.createOffer(
                    {
                        media: {
                            // data: true,
                            videoSend: false,
                            videoRecv: false,
                        },
                        simulcast: false,
                        success: function (jsep) {

                            let body = {"request": "call", "username": ToUsername};
                            sfutest.send({"message": body, "jsep": jsep});
                        },
                        error: function (error) {
                        }
                    });
            }
        }

    }
    _audioSet = () => {
        if (audioEnable) {
            this.refs.toast.show('关闭麦克风');
            this.setState({
                Audioimage: require('../icon/ic_mic_off_white_48dp.png')
            })
        } else {
            this.refs.toast.show('开启麦克风');
            this.setState({
                Audioimage: require('../icon/ic_mic_white_48dp.png')

            })
        }
        if (isSipCall) {
            if (audioEnable) {
                sipCall.muteAudio()
            } else {
                sipCall.unmuteAudio()
            }
        } else {
            if (audioEnable) {
                sfutest.muteAudio()
            } else {
                sfutest.unmuteAudio()
            }
        }
        audioEnable = !audioEnable
    }

    _setSpeaker() {
        speakerAudio = !speakerAudio
        if (!speakerAudio) {
            this.refs.toast.show('打开扬声器');
            this.setState({
                SpeakerImage: require('../icon/ic_volume_up_white_48dp.png')
            })
            let trackById = remoteStream.getTrackById('janusa0');
            trackById.enabled = true;
        } else {
            this.refs.toast.show('关闭扬声器');
            this.setState({
                SpeakerImage: require('../icon/ic_volume_off_white_48dp.png')
            })
            let trackById = remoteStream.getTrackById('janusa0');
            trackById.enabled = false;
        }
    }

    _startAnimation(toValue, duration) {
        // this.state.frameValue = new Animated.View(0);
        this.state.frameValue.setValue(0);
        this._animated = Animated.timing(
            this.state.frameValue,
            {
                toValue: toValue,
                duration: duration,
                easing: Easing.linear,
            }
        );
        this._animated.start(() => {
            this._startAnimation(3, 1000);
        });
        this.state.frameValue.addListener((event) => {
            let nextImage = parseInt(event.value);
            if (nextImage !== this.state.imageSource) {
                console.info("跳动：" + nextImage + "  -- ")
                this.setState({
                    imageSource: parseInt(event.value),
                });
            }
        });
    }

    render() {
        let source = TabIcon[this.state.imageSource];
        return (
            <View style={{flex: 1, alignItems: 'center'}}>
                <ImageBackground source={require('../icon/back.png')}
                                 style={(this.state.curOrt == 'PORTRAIT') ? styles.ViewStyle2 : styles2.ViewStyle2}>
                    <Text style={(this.state.curOrt == 'PORTRAIT') ? styles.TitleStyle : styles2.TitleStyle}>音频通话</Text>
                    <Text style={{color: '#fff', fontSize: 16, marginTop: 10}}>{ToUsername}</Text>
                    <Text style={{
                        fontSize: 13,
                        justifyContent: 'center',
                        marginTop: 10,
                        color: '#fff'
                    }}>{this.state.TimeTxt}</Text>


                    {/*<View style={{*/}
                    {/*    height: (this.state.curOrt == 'PORTRAIT') ? height : width,*/}
                    {/*    position: 'absolute',*/}
                    {/*    alignSelf: 'center', flex: 1,*/}
                    {/*    justifyContent: 'center',*/}
                    {/*    alignItems: 'center',*/}
                    {/*    // marginTop: (this.state.curOrt == 'PORTRAIT') ? height / 3 : width / 3,*/}
                    {/*}}>*/}

                    {/*    <Image style={{height: 200, width: 200}} source={source}/>*/}


                    {/*    <SvgUri*/}
                    {/*        width="200"*/}
                    {/*        height="200"*/}
                    {/*        source={require('../assets/test.svg')}*/}
                    {/*        // source={{*/}
                    {/*        //     uri: 'http://thenewcode.com/assets/images/thumbnails/homer-simpson.svg',*/}
                    {/*        // }}*/}
                    {/*    />*/}
                    {/*</View>*/}


                    <View style={styles.BottomView}>
                        <TouchableOpacity
                            onPress={() => {
                                this._audioSet()
                            }}
                        >
                            <View>
                                <Image source={this.state.Audioimage} style={styles.BottomIcon}/>
                                <Text
                                    style={(this.state.curOrt == 'PORTRAIT') ? styles.TextStyle : styles2.TextStyle}>静音</Text>
                            </View>
                        </TouchableOpacity>


                        <TouchableOpacity onPress={() => {
                            this._setSpeaker()
                        }}>
                            <View style={{marginLeft: 80}}>
                                <Image source={this.state.SpeakerImage} style={styles.BottomIcon}/>
                                <Text
                                    style={(this.state.curOrt == 'PORTRAIT') ? styles.TextStyle : styles2.TextStyle}>扬声器</Text>
                            </View>
                        </TouchableOpacity>


                        <TouchableOpacity
                            onPress={() => {
                                InCallManager.stopRingback()
                                let hangup = {"request": "hangup"};
                                if (Global.isSip) {
                                    sipCall.send({"message": hangup});
                                } else {
                                    sfutest.send({"message": hangup});
                                }
                                this.doHangup();
                                if (this.state.curOrt == 'PORTRAIT') {
                                    StatusBar.setHidden(false, 'slide')
                                } else {
                                    StatusBar.setHidden(true, 'slide')
                                }
                                this.props.navigation.goBack()
                            }}
                        >
                            <View style={{marginLeft: 80}}>
                                <Image source={require('../icon/hangup_call.png')} style={styles.BottomIcon}/>
                                <Text
                                    style={(this.state.curOrt == 'PORTRAIT') ? styles.TextStyle : styles2.TextStyle}>挂断</Text>
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
        marginTop: ViewPositionTop,
        flexDirection: 'row',
        width: height > width ? width : height,
        height: 50,
        alignItems: 'center',

        // justifyContent:'space-between',
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
        marginTop: ViewPositionTop,
        fontSize: 17,
        color: '#fff',
        textAlign: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                lineHeight: 50,

            },
            android: {}
        })
    },
    Reloation: {
        width: 40,
        height: 40,
        marginRight: 10,
    },
    BottomView: {
        alignSelf: 'center',
        flex: 1,
        alignItems: 'center',
        flexDirection: 'row',
        position: 'absolute',
        bottom: bottomHeight,
        justifyContent: 'space-between'
    },
    BottomIcon: {
        justifyContent: 'center',
        alignItems: 'center',
        width: 45,
        height: 45,
    },
    TextStyle: {
        justifyContent: 'center',
        alignItems: 'center',
        fontSize: 17,
        color: '#fff',
        textAlign: 'center',
        marginTop: 10,
    },
    RemoteRTCStyle: {
        width: height > width ? width : height,
        height: 200,
        backgroundColor: 'red',
    },
    localRTCStyle: {
        width: height > width ? width : height,
        height: 200,
        backgroundColor: 'black'
    }
})

const styles2 = StyleSheet.create({
    ViewStyle2: {
        width: height > width ? height : width,
        height: height > width ? width : height,
        alignItems: 'center',
    },
    TopStyle: {
        marginTop: ViewPositionTop,
        flexDirection: 'row',
        width: height > width ? width : height,
        height: 50,
        alignItems: 'center',

        // justifyContent:'space-between',
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
        marginTop: 10,
        fontSize: 17,
        color: '#fff',
        textAlign: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                lineHeight: 50,
            }
        })
    },
    Reloation: {
        width: 40,
        height: 40,
        marginRight: 10,
    },
    BottomIcon: {
        alignSelf: 'center',
        width: 45,
        height: 45,
    },
    TextStyle: {
        fontSize: 15,
        color: '#fff',
        textAlign: 'center',
        marginTop: 2,
    },
    RemoteRTCStyle: {
        width: height > width ? width : height,
        height: 200,
        backgroundColor: 'red',
    },
    localRTCStyle: {
        width: height > width ? width : height,
        height: 200,
        backgroundColor: 'black'
    }
})


function sipdoHangup() {
    var hangup = {"request": "hangup"};
    sipCall.send({"message": hangup});
    sipCall.hangup();
}
