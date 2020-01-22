import React, {Component} from 'react';
import {
    Alert,
    AppState,
    DeviceEventEmitter,
    Dimensions,
    FlatList,
    Image,
    ImageBackground,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import {RTCView} from 'react-native-webrtc';
import Janus from '../janus.mobile.js';
import InCallManager from 'react-native-incall-manager';
import {GiftedChat} from 'react-native-gifted-chat';
import Global from "../Global";
import Orientation from "react-native-orientation";
import Toast from 'react-native-easy-toast'

var IsIOS = Platform.OS === 'ios' ? 1 : 0
var isIphoneX = ((IsIOS) && (height >= 812)) ? 1 : 0
var {width, height} = Dimensions.get('window')
var bottomHeight2 = isIphoneX ? 68 : 30
var bottomHeight = isIphoneX ? 68 : 20
let roomId = 12
let janus;
let myusername = '';
let myid = null;
let mystream = null;
let started = false;
let sfutest = null;
let bitrateTimer = [];
let sendData = null;
var opaqueId = "videoroomtest-" + Math.random().toString().slice(-10);
var isFront = true;
Janus.init({
    debug: false, callback: function () {
        if (started)
            return;
        started = true;
    }
});

class Main extends Component {
    constructor(props) {
        super(props);
        this.state = {
            selfViewSrc: null,
            selfViewSrcKey: null,
            publish: false,
            info: 'Initializing',
            status: 'init',
            remoteList: {},
            remoteListPluginHandle: {},
            remoteStreams: {},
            mainViewSrc: null,
            text: '',
            roomList: [],
            chatList: [],
            audioMute: false,
            videoMute: false,
            speaker: true,
            remoteMute: false,
            currentId: '',
            messages: [],
            curOrt: 'PORTRAIT',
            videoImage: require('../icon/ic_videocam_white_48dp.png'),
            audioImage: require('../icon/ic_mic_white_48dp.png'),
            soundImage: require('../icon/ic_volume_up_white_48dp.png'),
            isVideoOpen: true,
        }
        this.handleAppStateChange = this.handleAppStateChange.bind(this)
    }

    static navigationOptions = ({navigation}) => ({
        header: null
    })
    _orientationDidChange = (ori) => {
        this.setState({
            curOrt: ori
        });
    }

    componentWillMount() {
        AppState.addEventListener('change', this.handleAppStateChange);
        this.state.curOrt = Global.orientationStr;
    }

    componentWillUnmount() {
        Global.currentPage = 'CallVC'
        AppState.removeEventListener('change', this.handleAppStateChange);
        Orientation.removeOrientationListener(this._orientationDidChange);
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

    componentDidMount() {
        Global.currentPage = 'room'
        Orientation.addOrientationListener(this._orientationDidChange);
        let {room, displayname, gateway} = this.props.navigation.state.params;
        myusername = displayname;
        roomId = parseInt(room);
        // InCallManager.start({media: 'audio'})
        console.info("gatawa:" + gateway)
        janus = new Janus({
            server: `http://${gateway}/janus`,
            success: () => {
                janus.attach({
                    plugin: "janus.plugin.videoroom",
                    opaqueId: opaqueId,
                    success: (pluginHandle) => {
                        sfutest = pluginHandle;
                        sendData = sfutest.data;
                        let register = {
                            "request": "join",
                            "room": roomId,
                            "ptype": "publisher",
                            "display": myusername.toString()
                        };
                        sfutest.send({"message": register});
                    },
                    error: (error) => {
                        console.info("error" + error)
                    },
                    consentDialog: (on) => {
                    },
                    mediaState: (medium, on) => {
                    },
                    webrtcState: (on) => {
                    },
                    onmessage: (msg, jsep) => {
                        if (this.state.unmount) {
                            return;
                        }
                        var event = msg["videoroom"];
                        if (event != undefined && event != null) {
                            if (event === "joined") {
                                console.info("\n\n打开扬声器")
                                InCallManager.setSpeakerphoneOn(true)
                                myid = msg["id"];
                                this.publishOwnFeed(true);
                                if (msg["publishers"] !== undefined && msg["publishers"] !== null) {
                                    var list = msg["publishers"];
                                    this.setState({
                                        roomList: list
                                    })
                                    for (var f in list) {
                                        var id = list[f]["id"];
                                        var display = list[f]["display"];
                                        this.newRemoteFeed(id, display)
                                    }
                                }
                            } else if (event === "destroyed") {
                            } else if (event === "event") {
                                if (msg["publishers"] !== undefined && msg["publishers"] !== null) {
                                    var list = msg["publishers"];
                                    for (var f in list) {
                                        let id = list[f]["id"]
                                        let display = list[f]["display"]
                                        this.newRemoteFeed(id, display)
                                    }
                                } else if (msg["leaving"] !== undefined && msg["leaving"] !== null) {
                                    var leaving = msg["leaving"];
                                    var remoteFeed = null;
                                    let numLeaving = parseInt(msg["leaving"])
                                    if (this.state.remoteList.hasOwnProperty(numLeaving)) {
                                        delete this.state.remoteList[numLeaving]
                                        this.setState({remoteList: this.state.remoteList})
                                        this.state.remoteListPluginHandle[numLeaving].detach();
                                        delete this.state.remoteListPluginHandle[numLeaving]
                                    }
                                } else if (msg["unpublished"] !== undefined && msg["unpublished"] !== null) {
                                    var unpublished = msg["unpublished"];
                                    if (unpublished === 'ok') {
                                        sfutest.hangup();
                                        return;
                                    }
                                    let numLeaving = parseInt(msg["unpublished"])
                                    if (this.state.remoteList.hasOwnProperty(numLeaving)) {
                                        delete this.state.remoteList[numLeaving]
                                        this.setState({remoteList: this.state.remoteList})
                                        this.state.remoteListPluginHandle[numLeaving].detach();
                                        delete this.state.remoteListPluginHandle[numLeaving]
                                    }
                                } else if (msg["error"] !== undefined && msg["error"] !== null) {
                                    if (msg["error_code"] == 426) {
                                        let register = {
                                            "request": "create",
                                            "room": roomId,
                                            "permanent": false,
                                            "is_private": false,
                                        };
                                        sfutest.send({"message": register});
                                    }
                                }
                            }
                        }
                        if (jsep !== undefined && jsep !== null) {
                            sfutest.handleRemoteJsep({jsep: jsep});
                        }
                    },
                    onlocalstream: (stream) => {
                        if (this.state.unmount) {
                            return;
                        }
                        let videoTracks = stream.getVideoTracks();
                        if (videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
                        } else {
                            this.setState({selfViewSrc: stream.toURL(), mainViewSrc: stream.toURL()});
                            this.setState({selfViewSrcKey: Math.floor(Math.random() * 1000)});
                        }
                    },
                    onremotestream: (stream) => {
                        // if (this.state.unmount) {
                        //     return;
                        // }
                        // let videoTracks = stream.getVideoTracks();
                        // if (videoTracks === null || videoTracks === undefined || videoTracks.length === 0) {
                        // } else {
                        //     this.setState({mainViewSrc: stream.toURL()});
                        // }
                    },
                    oncleanup: () => {
                    }
                });
            },
            error: (error) => {
                console.info("网络断开了")
                Global.isConnected = false;
                DeviceEventEmitter.emit('login', "janus:" + error);
            },
            destroyed: () => {
            }
        })
        this.deEmitter = DeviceEventEmitter.addListener('login', (a) => {
                if (this.state.unmount) {
                    return;
                }
                if (a != 'success') {
                    console.info("\n出错了：" + a)
                    StatusBar.setHidden(false, 'slide')
                    this.props.navigation.goBack()
                }
            }
        );
        StatusBar.setHidden(true, 'slide')
    }

    publishOwnFeed(useAudio) {
        if (!this.state.publish) {
            this.setState({publish: true});
            sfutest.createOffer(
                {
                    media: {audioRecv: false, videoRecv: false, audioSend: useAudio, videoSend: true, data: true},
                    success: (jsep) => {
                        var publish = {"request": "configure", "audio": useAudio, "video": true};
                        sfutest.send({"message": publish, "jsep": jsep});
                    },
                    error: (error) => {
                        Alert.alert("WebRTC error:", error);
                        if (useAudio) {
                            publishOwnFeed(false);
                        } else {
                        }
                    }
                });
        } else {
            // this.setState({ publish: false });
            // let unpublish = { "request": "unpublish" };
            // sfutest.send({"message": unpublish});
        }
    }

    newRemoteFeed(id, display) {
        let remoteFeed = null;
        janus.attach(
            {
                plugin: "janus.plugin.videoroom",
                success: (pluginHandle) => {
                    remoteFeed = pluginHandle;
                    let listen = {"request": "join", "room": roomId, "ptype": "listener", "feed": id};
                    remoteFeed.send({"message": listen});
                },
                error: (error) => {
                    Alert.alert("  -- Error attaching plugin...", error);
                },
                onmessage: (msg, jsep) => {
                    let event = msg["videoroom"];
                    if (event != undefined && event != null) {
                        if (event === "attached") {
                            // Subscriber created and attached
                        }
                    }
                    if (jsep !== undefined && jsep !== null) {
                        remoteFeed.createAnswer(
                            {
                                jsep: jsep,
                                media: {audioSend: false, videoSend: false, data: true},
                                success: (jsep) => {
                                    var body = {"request": "start", "room": roomId};
                                    remoteFeed.send({"message": body, "jsep": jsep});
                                },
                                error: (error) => {
                                    Alert.alert("WebRTC error:", error)
                                }
                            });
                    }
                },
                webrtcState: (on) => {
                },
                onlocalstream: (stream) => {
                },
                onremotestream: (stream) => {
                    this.setState({info: 'One peer join!'});
                    const remoteList = this.state.remoteList;
                    const remoteListPluginHandle = this.state.remoteListPluginHandle;
                    remoteList[id] = stream.toURL();
                    remoteListPluginHandle[id] = remoteFeed;

                    const remoteStreams = this.state.remoteStreams;
                    remoteStreams[id] = stream;
                    this.setState({
                        remoteList: remoteList,
                        remoteListPluginHandle: remoteListPluginHandle,
                        remoteStreams: remoteStreams
                    });
                },
                oncleanup: () => {
                    if (remoteFeed.spinner !== undefined && remoteFeed.spinner !== null)
                        remoteFeed.spinner.stop();
                    remoteFeed.spinner = null;
                    if (bitrateTimer[remoteFeed.rfindex] !== null && bitrateTimer[remoteFeed.rfindex] !== null)
                        clearInterval(bitrateTimer[remoteFeed.rfindex]);
                    bitrateTimer[remoteFeed.rfindex] = null;
                },
                ondata: (data) => {
                    if (JSON.parse(data)["type"] == 'chatMsg') {
                        // let display = this.findFeed(id)[0].display;
                        this.state.chatList.push({
                            content: JSON.parse(data)["content"],
                            display,
                            time: new Date().toLocaleTimeString()
                        })
                        let messages = {
                            _id: Math.floor(Math.random() * 100000) + '',
                            text: JSON.parse(data)["content"],
                            createdAt: new Date(),
                            user: {
                                _id: id,
                                name: display
                            },
                        }
                        this.setState((previousState) => ({
                            messages: GiftedChat.append(previousState.messages, messages),
                        }))
                        this.setState({
                            chatList: this.state.chatList,
                            messages: this.state.messages
                        })
                    }
                }
            });
    }

    endCall = () => {
        janus.destroy()
        StatusBar.setHidden(false, 'slide')
        this.props.navigation.goBack()
        // this.props.navigation.dispatch(StackActions.reset({
        //     index:1,
        //     actions: [
        //     NavigationActions.navigate({ routeName: 'Home' })
        //     ],
        // }))
    }

    changeRTCViewSrc = (key = null) => {
        if (key) {
            this.setState({
                mainViewSrc: this.state.remoteList[key],
                currentId: key
            })
        } else {
            this.setState({
                mainViewSrc: this.state.selfViewSrc,
                currentId: ''
            })
        }
    }

    sendMsg = () => {
        var text = JSON.stringify({
            type: 'chatMsg',
            content: this.state.text
        });
        sendData({
            text,
            success: () => {
                let chatLists = this.state.chatList
                chatLists.push({
                    content: this.state.text,
                    display: myusername,
                    time: new Date().toLocaleTimeString()
                })
                this.setState({
                    chatList: chatLists
                })
                // if(this.refs.flatList){
                //   this.refs.flatList.scrollToIndex({index: this.state.chatList.length-1,viewOffset:40, viewPosition: 1})
                // }

            },
            error: (reason) => {
                console.log(reason);
            },
        })
    }

    endEdit = () => {
        if (this.state.text !== '') {
            this.sendMsg();
        }
        this.setState({
            text: ''
        })
    }

    findFeed = (id) => {
        return this.state.roomList.filter((v, i) => {
            if (v.id == id) {
                return v.display
            }
        })
    }
    switchVideoType = () => {
        if (isFront) {
            this.refs.toast.show('切换后置摄像头');
        } else {
            this.refs.toast.show('切换前置摄像头');
        }
        sfutest.changeLocalCamera(isFront);
        isFront = !isFront;
    }

    toggleVideoMute = () => {
        let muted = sfutest.isVideoMuted();
        if (muted) {
            this.setState({
                videoMute: false,
                videoImage: require('../icon/ic_videocam_white_48dp.png')
            });
            sfutest.unmuteVideo();
            this.state.isVideoOpen = true;
        } else {
            this.setState({
                videoMute: true,
                videoImage: require('../icon/ic_videocam_off_white_48dp.png')
            });
            sfutest.muteVideo();
            this.state.isVideoOpen = false;

        }
    }

    toggleSpeaker = () => {
        if (this.state.speaker) {
            this.setState({
                speaker: false,
                soundImage: require('../icon/ic_volume_off_white_48dp.png')
            });
            Object.keys(this.state.remoteStreams).map((key) => {
                let remoteListElement = this.state.remoteStreams[key];
                let trackById = remoteListElement.getTrackById('janusa0');
                trackById.enabled = false;
            })
        } else {
            this.setState({
                speaker: true,
                soundImage: require('../icon/ic_volume_up_white_48dp.png')
            });
            Object.keys(this.state.remoteStreams).map((key) => {
                let remoteListElement = this.state.remoteStreams[key];
                let trackById = remoteListElement.getTrackById('janusa0');
                trackById.enabled = true;
            })
        }
    }

    toggleAudioMute = () => {
        // this.props.App.test()
        let muted = sfutest.isAudioMuted();
        if (muted) {
            sfutest.unmuteAudio();
            this.setState({
                audioMute: false,
                audioImage: require('../icon/ic_mic_white_48dp.png')
            });
        } else {
            sfutest.muteAudio();
            this.setState({
                audioMute: true,
                audioImage: require('../icon/ic_mic_off_white_48dp.png')
            });

        }
    }

    remoteMute = () => {
        var text = JSON.stringify({
            type: 'muteRequest',
            content: {target: this.state.currentId}
        });
        if (this.state.remoteMute) {
            this.setState({remoteMute: false})
        } else {
            this.setState({remoteMute: true})
            sendData({
                text,
                success: () => {

                },
                error: (reason) => {
                    console.log(reason)
                }
            })
        }
    }

    onSend(messages = []) {
        this.setState(previousState => ({
            messages: GiftedChat.append(previousState.messages, messages),
        }), () => {
            console.log(this.state.messages)
            var text = JSON.stringify({
                type: 'chatMsg',
                content: this.state.messages[0].text
            });
            sendData({
                text,
                success: () => {

                },
                error: (reason) => {
                    console.log(reason);
                }
            })
        })
    }

    render() {
        let v = this.state.isVideoOpen ?
            <RTCView style={(this.state.curOrt == 'PORTRAIT') ? styles.mainView : styles2.mainView}
                     streamURL={this.state.selfViewSrc} zOrder={1}/> : null;
        return (
            <View style={(this.state.curOrt == 'PORTRAIT') ? styles.ViewStyle : styles2.ViewStyle2}>
                <ImageBackground source={require('../icon/back.png')}
                                 style={(this.state.curOrt == 'PORTRAIT') ? styles.ViewStyle : styles2.ViewStyle2}>

                    <FlatList
                        style={(this.state.curOrt == 'PORTRAIT') ? styles.changeView : styles2.changeView}
                        numColumns={3}
                        data={Object.values(this.state.remoteList).map(item => item)}
                        renderItem={({item}) =>
                            <RTCView streamURL={item}
                                     style={(this.state.curOrt == 'PORTRAIT') ? styles.remoteView : styles2.remoteView}
                                     zOrder={0}/>
                        }
                    />
                    {v}

                    {/*<ScrollView style={styles.changeView} horizontal={true}>*/}
                    {/*    /!*{this.state.selfViewSrc && (<TouchableOpacity onPress={() => {*!/*/}
                    {/*    /!*    this.changeRTCViewSrc(null)*!/*/}
                    {/*    /!*}}>*!/*/}
                    {/*    /!*    <RTCView key={this.state.selfViewSrcKey} streamURL={this.state.selfViewSrc}*!/*/}
                    {/*    /!*             style={styles.selfView} zOrder={98}/>*!/*/}
                    {/*    /!*</TouchableOpacity>)}*!/*/}

                    {/*    {this.state.remoteList.length !== 0 && Object.keys(this.state.remoteList).map((key, index) => {*/}
                    {/*        return (<TouchableOpacity onPress={() => {*/}
                    {/*            // this.changeRTCViewSrc(key)*/}
                    {/*        }} key={index}>*/}
                    {/*            <RTCView key={key} streamURL={this.state.remoteList[key]} style={styles.remoteView}*/}
                    {/*                     zOrder={99}/>*/}
                    {/*        </TouchableOpacity>)*/}
                    {/*    })}*/}
                    {/*</ScrollView>*/}
                    <View style={{
                        position: "absolute",
                        right: 0,
                    }}>
                        <TouchableOpacity
                            onPress={() => {
                                this.switchVideoType()
                            }}
                        >
                            <Image source={require('../icon/switch_camera.png')}
                                   style={{
                                       height: 40, width: 40, marginTop: 10, marginEnd: 10
                                   }}/>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.BottomView}>
                        <TouchableOpacity
                            onPress={() => {
                                this.toggleAudioMute()
                            }}
                        >
                            <View style={{justifyContent: 'center'}}>
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
                                this.toggleSpeaker()
                            }}
                        >
                            <View style={{justifyContent: 'center'}}>
                                <Image source={this.state.soundImage} style={styles.BottomIcon}/>
                                <Text
                                    style={(this.state.curOrt == 'PORTRAIT') ? styles.TextStyle : styles2.TextStyle}>扬声器</Text>
                            </View>
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={() => {
                                this.toggleVideoMute()
                            }}>
                            <View style={{justifyContent: 'center'}}>
                                <Image source={this.state.videoImage} style={styles.BottomIcon}/>
                                <Text
                                    style={(this.state.curOrt == 'PORTRAIT') ? styles.TextStyle : styles2.TextStyle}>摄像头</Text>
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={() => {
                                this.endCall()
                            }}
                        >
                            <View style={{justifyContent: 'center'}}>
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
        );
    }
}

const styles = StyleSheet.create({
    ViewStyle: {
        width: height > width ? width : height,
        height: height > width ? height : width,
        alignItems: 'center',
    },
    gridView: {
        position: 'absolute',
        marginTop: 10,
    },
    itemContainer: {
        borderRadius: 5,
        padding: 5,
        height: 90,
    },
    itemName: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '600',
    },
    itemCode: {
        fontWeight: '600',
        fontSize: 12,
        color: '#fff',
    },


    container: {
        display: 'none',
        // flex: 1,
        // justifyContent: 'center',
        // backgroundColor: '#fff',
        // marginBottom: 10
        top: 200,
        position: "absolute",
        // backgroundColor: '#FC0A33',
        width: 140,
        height: 240,
        backgroundColor: '#555'

    },
    mainView: {
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: Dimensions.get('window').height / 2,
        width: height > width ? width / 2.5 : height / 2.5,
        height: height > width ? height / 3 : height / 3,
    },

    viewBtn: {
        flex: 1,
        justifyContent: 'space-between',
        position: 'absolute',
        top: 10,
        right: 20,
        height: Dimensions.get('window').height / 2.3,
    },
    changeView: {
        flexDirection: 'row',
        position: "absolute",
        // backgroundColor: '#00FF40',
        width: height > width ? width : height,
        height: Dimensions.get('window').height / 2.3,
    },
    selfView: {
        backgroundColor: '#999',
        width: width / 3.06,
        height: Dimensions.get('window').height / 5,
        margin: 1
        //   transform: [{rotate:'90deg'}]
    },
    remoteView: {
        backgroundColor: '#999',
        width: Dimensions.get('window').width / 3.06,
        height: Dimensions.get('window').height / 5,
        margin: 1,
    },
    chatContainer: {
        flex: 1,
        flexDirection: 'column',
        height: Dimensions.get('window').height - Dimensions.get('window').height / 2 - Dimensions.get('window').height / 5 - 40,
        backgroundColor: '#fff'
    },
    chatLists: {
        flex: 3,
        marginBottom: 40
    },
    chatUser: {
        flex: 1,
        justifyContent: 'space-between',
        flexDirection: 'row'
    },
    sendContainer: {
        height: 40,
        width: Dimensions.get('window').width,
        flexDirection: 'row',
        position: 'absolute',
        bottom: 0,
        left: 0,
        backgroundColor: '#fff'
    },
    sendInput: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        flex: 3
    },
    sendBtn: {
        alignItems: 'center',
        backgroundColor: '#DDDDDD',
        padding: 10
    },

    ViewStyle2: {
        width: width,
        height: height,
        alignItems: 'center',
    },
    TopStyle: {
        position: "absolute",
        flexDirection: 'row',
        width: width,
        height: 70,
        marginTop: isIphoneX ? 20 : 0
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
});


const styles2 = StyleSheet.create({
    remoteView: {
        backgroundColor: '#999',
        width: height > width ? height / 5 : width / 5,
        height: height > width ? width / 3.5 : height / 3.5,
        margin: 1,
    },
    ViewStyle2: {
        width: height > width ? height : width,
        height: height > width ? width : height,
        alignItems: 'center',
    },
    changeView: {
        flexDirection: 'row',
        position: "absolute",
        alignSelf: "flex-start",
        // backgroundColor: '#00FF40',
        marginLeft: 20,
        height: height > width ? width / 2 : height / 2,
        marginTop: 20,
        width: height > width ? height / 1.5 : width / 1.5,
    },
    gridView: {
        position: 'absolute',
        marginTop: 10,
    },
    mainView: {
        // backgroundColor:'#fff',
        alignSelf: 'flex-end',
        position: 'absolute',
        right: 20,
        marginTop: 80,
        width: height > width ? height / 4 : width / 4,
        height: height > width ? width / 2.5 : height / 2.5,
    },
    TopStyle: {
        position: "absolute",
        flexDirection: 'row',
        width: height,
        height: 70,
        marginTop: isIphoneX ? 20 : 0
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
        position: "absolute",
        // backgroundColor: '#00FF40',
        width: height + 80,
        height: width + 20,
    },
})

export default Main;
