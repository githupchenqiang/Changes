import React, {Component} from 'react'
import {
    AppRegistry,
    AppState,
    BackHandler,
    DeviceEventEmitter,
    Dimensions,
    Image,
    ImageBackground,
    Keyboard,
    Platform,
    StatusBar,
    StyleSheet,
    Text,
    TextInput,
    TouchableHighlight,
    TouchableOpacity,
    View,
    Alert,
} from 'react-native';
import ModalDropdown from 'react-native-modal-dropdown';
import Global from "../Global";
import DialogSelected from '../HomeControl/CallCommingView'
import Toast from 'react-native-easy-toast'
import ChooseView from './Choose'
import Singleton from "../USerControl/Singleton";
import {storage} from '../storageUtil'
import moment from 'moment';
import IdleTimerManager from "react-native-idle-timer";
import Orientation from "react-native-orientation";
import {Geolocation, init} from "react-native-amap-geolocation";
import {setLocatingWithReGeocode, setNeedAddress} from "react-native-amap-geolocation";
// import BGTimer from 'react-native-inback-timer-ios';
// import { setInterval, setDistanceFilter } from "react-native-amap-geolocation";

var {width, height} = Dimensions.get('window')
var IsIOS = Platform.OS === 'ios' ? 1 : 0
var isIphoneX = (IsIOS && height >= 812 && width >= 375) ? 1 : 0
var navigationBarHeight = isIphoneX ? 88 : 64
var stateBar = isIphoneX ? 44 : 20
var ViewPositionTop = stateBar + 10
var SipVideoCall = true;
var CommingIsVideoCall = true; //标记来电是音频呼叫还是视频呼叫
let CommingCalljsep = null;
var Username = ''
const selectedArr = ["网关呼叫", "SIP呼叫"];
var ServerIP = ''
var loginName = ''
var passWord = ''
var sipCall = null
var videoCall = null
let lastBackPressed = Date.now()
let SetTimer
if (IsIOS) {
    NativeTest  = require('react-native').NativeModules.NativeiOSMethod;
}
export default class componentName extends Component {
    constructor(props) {
        super(props)
        // showAlertSelected = this.showAlertSelected.bind(this);
        // this.callbackSelected = this.callbackSelected.bind(this);
        this.showChooseView = this.showChooseView.bind(this)
        this.chooseClick = this.chooseClick.bind(this)
        this.state = {
            WriteName: '',
            longitude: '',//经度
            latitude: '',//纬度
            clickAudio: true,
            location: '',
            serverIP: '',
            gatewayIP: '',
            online: '#41D274',
            curOrt: 'PORTRAIT',
            history: [],
            unmount: false,
            callable: true,
        }
        this.handleAppStateChange = this.handleAppStateChange.bind(this)
    }

    _orientationDidChange = (ori) => {
        console.info("切换了" + ori)

        this.setState({
            curOrt: ori
        });
        if (Global.currentPage == 'CallVC') {
            if (this.state.curOrt == 'PORTRAIT') {
                StatusBar.setHidden(false, 'slide')
            } else {
                StatusBar.setHidden(true, 'slide')
            }
        }
        Orientation.addSpecificOrientationListener((specificOrientation) => {
            if (specificOrientation == "PORTRAIT") {

            } else {

            }
        });

    }

    componentWillMount() {
        Global.currentPage = 'CallVC'
        AppState.addEventListener('change', this.handleAppStateChange);
        this.state.curOrt = Global.orientationStr;
        IdleTimerManager.setIdleTimerDisabled(true);
        if (!IsIOS) {
            BackHandler.addEventListener('hardwareBackPress', this.onBackAndroid);
        }
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
        AppRegistry.registerHeadlessTask("SomeTaskName", () =>{
            console.info('====become====')
        });
        AppState.removeEventListener('change', this.handleAppStateChange);
        Global.currentPage = 'Login'
        IdleTimerManager.setIdleTimerDisabled(false);
        this.timer1 && clearInterval(this.timer1);
        if (!IsIOS) {
            BackHandler.removeEventListener('hardwareBackPress', this.onBackAndroid);
        }
        Orientation.removeOrientationListener(this._orientationDidChange);
        this.state.unmount = true;
    }

    //来电
    showChooseView() {
        var calltypeAlert = ''
        if (Global.isSip) {
            if (SipVideoCall) {
                calltypeAlert = '视频通话...'
            } else {
                calltypeAlert = '语音通话...'
            }
        } else {
            if (CommingIsVideoCall) {
                calltypeAlert = '视频通话...'
            } else {
                calltypeAlert = '语音通话...'
            }
        }
        if (this.choose == null) {
        } else {
            storage.load('falseSwitchIsOn', (falseSwitchIsOn) => {
                if (falseSwitchIsOn == '') {
                    this.autoAccept(calltypeAlert, false)
                } else {
                    this.autoAccept(calltypeAlert, falseSwitchIsOn)
                }
            });
        }
    }

    autoAccept(calltypeAlert, accept) {
        if (accept) {
            this.chooseClick(1)
        } else {
            this.choose.show(calltypeAlert + "\n" + Username, "挂断", "接听", this.chooseClick)
        }
    }

    //拨号选项
    // showAlertSelected() {
    //     this.dialog.show("", selectedArr, '#333333', this.callbackSelected);
    // }

    //呼叫模式点击事件
    // callbackSelected(i) {
    //     switch (i) {
    //         case 0:
    //             if (this.state.clickAudio) {
    //                 this._chooseAudioNormalCall();
    //             } else {
    //                 this._chooseVideoNormalCall()
    //             }
    //             break;
    //         case 1:
    //             if (this.state.clickAudio) {
    //                 this._chooseAudioSipCall();
    //             } else {
    //                 this._chooseVideoSipCAll()
    //             }
    //             break;
    //     }
    // }

    //接听或拒绝
    chooseClick(num) {
        switch (num) {
            case 0: //拒绝
                this._doHang()
                break;
            case 1: //接听
                this._doCall();
                break;
        }
    }


    // _getUserLocationPosition() {
    //     navigator.geolocation.getCurrentPosition(
    //         res => {
    //             this.setState({
    //                 location: res.coords
    //             })
    //             // let data = {
    //             //     lng: res.coords.longitude, lat: res.coords.latitude,
    //             //     terminalNo: '123456', createTime: this.getTodayDate()
    //             // };
    //             // console.info("经纬度  --- " + JSON.stringify(data))
    //             let todayDate = this.getTodayDate();
    //             let formData = new FormData();
    //             formData.append("lng", res.coords.longitude);
    //             formData.append("lat", res.coords.latitude);
    //             formData.append("terminalNo", loginName);
    //             formData.append("createTime", todayDate);
    //             console.info(" 上传gps信息 --- " + res.coords.longitude + " -- " + res.coords.latitude + "  -- " + loginName + " -- " + todayDate)
    //             this.getGpsIP(formData)
    //         }, err => {
    //             console.info("经纬度失败： " + err.code + " -- " + err.message)
    //         }, {})
    // }

    getTodayDate() {
        let s = moment().format('YYYY-MM-DD HH:mm:ss');
        return s;
    };

    getGpsIP(data) {
        storage.load('gpsAddress', (ip) => {
            if (ip.length > 0) {
                this.uploadGps(ip, data)
            }
        })

        storage.load('gpsAddress2', (ipCar) => {
            if (ipCar.length > 0) {
                this.uploadGps(ipCar, data)
            }
        })
    }

    uploadGps(ip, data) {
        let url = "http://" + ip + "/cds-web/http/api/singlePolice/upload";
        console.log("上传gps接口地址:" + url);
        postRequest(url, data, function (result) {
            console.log("上传gps接口返回rspCode:" + result.rspCode);
        })
    }

    componentDidMount() {
        if (this.state.curOrt == 'LANDSCAPE') {
            StatusBar.setHidden(true, 'slide')
        }


        // SetTimer = BGTimer.setInterval(()=>{
        //     console.info('========定时器========')
        // },1000)



        setLocatingWithReGeocode(true); //返回反geo坐标
        Orientation.addOrientationListener(this._orientationDidChange);
        this.setState({
            online: '#41D274',
            callable: true,
        })
        let {username, password, ip} = this.props.navigation.state.params;
        ServerIP = ip;
        loginName = username;
        passWord = password;
        this.deEmitter = DeviceEventEmitter.addListener('onmessage', (msg, jsep) => {
            let result = msg["result"];
            if (result !== null && result !== undefined) {
                let event = result["event"];
                if (event === "incomingcall") {
                    console.info('====来电了incomingcall====' + Username)
                    console.info("\n\n@@@@@@来电了")
                    CommingCalljsep = jsep;
                    Global.isIncomming = true
                    Username = result["username"];
                    
                    NativeTest.addLocalNotice(Username)
                    let typeStr = result["username"];
                    let type = typeStr.substr(0, 3)
                    let notVP8 = jsep.sdp.indexOf('VP8') < 0;
                    if (type === "sip") {
                        SipVideoCall = (jsep.sdp.indexOf("m=video ") > -1);
                        if (!SipVideoCall) {
                            notVP8 = false
                        }
                    } else {
                        CommingIsVideoCall = (jsep.sdp.indexOf("m=video ") > -1);
                        if (!CommingIsVideoCall) {
                            notVP8 = false
                        }
                    }
                    if (Global.currentPage == 'VideoVC' || Global.currentPage == 'AudioVC' || Global.currentPage == 'room' || notVP8) {
                        let singleton = new Singleton();
                        if (type === "sip") {
                            sipCall = singleton.getSipcall()
                            var decline = {
                                "request": 'decline'
                            };
                            sipCall.send({
                                'message': decline
                            });
                        } else {
                            videoCall = singleton.getVideoCall()
                            var hangup = {
                                "request": 'hangup'
                            };
                            videoCall.send({
                                'message': hangup
                            });
                        }
                    } else {
                        if (type === "sip") {
                            Global.isSip = true
                        } else {
                            Global.isSip = false
                        }
                        this.showChooseView()
                    }
                }
            }
        });
        this.deEmitter = DeviceEventEmitter.addListener('login', (a) => {
            if (a == 'success') {
                this.setState({
                    online: '#41D274',
                    callable: true,
                })

            } else if (a.indexOf("Lost connection") >= 0 || a.indexOf('server down') >= 0 || a.indexOf('Is the gateway down') >= 0) {
                this.setState({
                    online: '#F42B17',
                    callable: false,
                })
            }
        });
        this.deEmitter = DeviceEventEmitter.addListener('logout', (a) => {
            this.logout()
        });
        // this._getUserLocationPosition()
        let todayDate = this.getTodayDate();
        Geolocation.getCurrentPosition(
            position => this.uploadGPS(position.location.longitude, position.location.latitude, todayDate),
            error => console.info("定位失败:" + error.message)
        );
        this.timer1 = setInterval(
            () => {
                let todayDate = this.getTodayDate();
                Geolocation.getCurrentPosition(
                    position => this.uploadGPS(position.location.longitude, position.location.latitude, todayDate),
                    error => console.info("定位失败:" + error.message)
                );
                // this._getUserLocationPosition()
            }, 10000,
        );
        this.showIPLayout();
    }

    uploadGPS(longitude, latitude, data) {
        let formData = new FormData();
        formData.append("lng", longitude);
        formData.append("lat", latitude);
        formData.append("terminalNo", loginName);
        formData.append("createTime", data);
        console.info(" 上传gps信息 --- " + longitude + " -- " + latitude + "  -- " + loginName + " -- " + data)
        this.getGpsIP(formData)
    }

    showIPLayout() {
        storage.load('ip', (ip) => {
            if (ip.length > 0) {
                this.setState({
                    serverIP: ip
                })
            }
        })
        storage.load('gateway', (ip) => {
            if (ip.length > 0) {
                this.setState({
                    gatewayIP: ip
                })
            }
        })
        storage.load('history', (info) => {
            if (info.length > 0) {
                const {type, number} = info[info.length - 1]
                this.setState({
                    history: info,
                    WriteName: number
                })
            }
        })
    }

    logout() {
        Global.currentPage = 'Login'
        let singleton = new Singleton()
        let janus = singleton.getJanus();
        sipCall = singleton.getSipcall()
        var unregister = {
            "request": 'unregister'
        };
        sipCall.send({
            'message': unregister
        });
        janus.destroy();
        this.props.navigation.goBack()
        
    }

    //选择点击事件
    _doCall = () => {
        if (Global.isSip) {
            if (SipVideoCall) {
                this.props.navigation.push('videoVC', {"user_name": Username, "jsep": CommingCalljsep})
            } else {
                this.props.navigation.push('audioVC', {
                    "user_name": Username,
                    "Calljsep": CommingCalljsep,
                    "isSip": true
                })
            }
        } else {
            if (CommingIsVideoCall) {
                this.props.navigation.push('videoVC', {"user_name": Username, "jsep": CommingCalljsep})
            } else {
                this.props.navigation.push('audioVC', {
                    "user_name": Username,
                    "Calljsep": CommingCalljsep,
                    "isSip": false
                })
            }
        }
    }

    render() {
        return (
            <View>
                <ImageBackground source={require('../icon/back.png')} style={(this.state.curOrt == 'PORTRAIT') ? {
                    width: height > width ? width : height,
                    height: height > width ? height : width,
                } : {
                    width: height > width ? height : width,
                    height: height > width ? width : height,
                }}>
                    <View style={{
                        position: 'absolute',
                        marginTop: isIphoneX ? stateBar : 26,
                        marginLeft: 20,
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 12,
                        height: 12,
                        backgroundColor: this.state.online,
                        borderColor: '#fff',
                        borderStyle: 'solid',
                        borderWidth: 1,
                        borderRadius: 15,
                        paddingBottom: 2
                    }}>
                        {/*<Text style={{fontSize:19,textAlign:'center',color:'#fff'}}>1</Text>*/}
                    </View>
                    <Text
                        style={{
                            marginLeft: 35,
                            fontSize: 12,
                            color: '#fff',
                            position: "absolute",
                            left: 2,
                            top: isIphoneX ? stateBar : 24
                        }}> {loginName}</Text>
                    <View style={{
                        alignSelf: 'flex-end'
                    }}>
                        <TouchableOpacity
                        onPress  = {()=>{
                            Global.currentPage = 'Setting'
                            this.props.navigation.push('Setting', {
                                editable: false
                            })
                        }}  
                        ><View style={{
                            right: 20,
                            height: 30,
                            width: 70,
                            top: IsIOS ? stateBar : 20,
                            alignSelf: 'flex-end',
                            

                        }}><Image source={require('../icon/ic_settings_white_48dp.png')}
                                  style={{width: 30, height: 30, alignSelf: 'flex-end'}}/>
                        </View>
                        </TouchableOpacity>
                    </View>


                    <View style={(this.state.curOrt == 'PORTRAIT') ? styles.center : styles2.center}>
                        <Text
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.AlertStyle : styles2.AlertStyle}>输入被叫号码</Text>
                        <View style={(this.state.curOrt == 'PORTRAIT') ? styles.midStyle : styles2.midStyle}>
                            <View style={styles.ImageBackStyle}>
                                <Image source={require('../icon/head.png')} style={styles.searchStyle}/>
                            </View>
                            <TextInput
                                style={(this.state.curOrt == 'PORTRAIT') ? styles.InputStyle : styles2.InputStyle}
                                placeholder='   例：123456'
                                onChangeText={(Text) => {
                                    this.setState({
                                        WriteName: Text,
                                    })
                                }}
                            >{this.state.WriteName}</TextInput>
                            <ModalDropdown onSelect={this._selectType}
                                           options={this.state.history}
                                           style={styles.RightBackStyle}
                                           showsVerticalScrollIndicator={false}
                                           dropdownTextStyle={{fontSize: 16}}
                                           renderButtonText={(rowData) => this._dropdown_2_renderButtonText(rowData)}
                                           renderRow={this._dropdown_2_renderRow.bind(this)}
                                           dropdownStyle={(this.state.curOrt == 'PORTRAIT') ? styles.listStyle : styles2.listStyle}
                            >

                                <View style={styles.RightBackStyle}>
                                    <Image source={require('../icon/Down.png')} style={styles.searchStyle}/>
                                </View>
                            </ModalDropdown>
                        </View>

                        <View style={(this.state.curOrt == 'PORTRAIT') ? styles.BottomStyle : styles2.BottomStyle}>
                            <TouchableOpacity
                                onPress={() => {
                                    if (this.state.callable) {
                                        if (this.state.WriteName.length > 0) {
                                            Global.isIncomming = false
                                            this._jumpAudioSession();
                                        }
                                    } else {
                                        this.refs.toast.show("未连接")
                                    }
                                }}
                            >
                                <View style={this.state.callable ? styles.iconViewStyle : styles.unable}>
                                    <Image source={require('../icon/phone.png')} style={styles.iconStyle}
                                    />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => {
                                    if (this.state.callable) {
                                        if (this.state.WriteName.length > 0) {
                                            Global.isIncomming = false
                                            this._jumpVideoSession()
                                        }
                                    } else {
                                        this.refs.toast.show("未连接")
                                    }
                                }}
                            >
                                <View style={this.state.callable ? styles.iconViewStyle : styles.unable}>
                                    <Image source={require('../icon/video.png')} style={styles.iconStyle}

                                    />
                                </View>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => {
                                    if (this.state.callable) {
                                        if (this.state.WriteName.length > 0) {
                                            var patrn = /^[0-9]*$/;
                                            if (!patrn.test(this.state.WriteName)) {
                                                this.refs.toast.show('必须为纯数字')
                                            } else {
                                                Global.isIncomming = false
                                                this._jumpMeetingSession()
                                            }
                                        }
                                    } else {
                                        this.refs.toast.show("未连接")
                                    }
                                }}
                            >
                                <View style={this.state.callable ? styles.iconViewStyle : styles.unable}>
                                    <Image source={require('../icon/metting.png')} style={styles.iconStyle}/>
                                </View>

                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text
                        style={(this.state.curOrt == 'PORTRAIT') ? styles.setServerAddress : styles2.setServerAddress}>会议服务器:{this.state.serverIP}</Text>
                    <Text
                        style={(this.state.curOrt == 'PORTRAIT') ? styles.setGateway : styles2.setGateway}>网关:{this.state.gatewayIP}</Text>

                    <DialogSelected ref={(dialog) => {
                        this.dialog = dialog;
                    }}/>
                    <ChooseView ref={(choose) => {
                        this.choose = choose
                    }}/>
                    <Toast ref="toast" fadeOutDuration={0}/>
                </ImageBackground>
            </View>    
        )
    }

    _dropdown_2_renderButtonText(rowData) {
        const {type, number} = rowData;
        return number;
    }

    _dropdown_2_renderRow(rowData, rowID, highlighted) {
        var icon;
        if (rowData.type == 'audio') {
            icon = require('../icon/type_audio.png')
        } else if (rowData.type == 'video') {
            icon = require('../icon/type_video.png')
        } else if (rowData.type == 'meet') {
            icon = require('../icon/type_meet.png')
        }
        return (
            <TouchableHighlight>
                <View style={[styles.dropdown_2_row]}>
                    <Image style={styles.dropdown_2_image}
                           mode='stretch'
                           source={icon}
                    />
                    <Text style={[styles.dropdown_2_row_text, highlighted && {color: 'mediumaquamarine'}]}>
                        {`${rowData.number}`}
                    </Text>
                </View>
            </TouchableHighlight>
        );
    }

    // 分类选择
    _selectType = (index, value) => {
        this.setState({
            WriteName: value.number
        })
    }

    // 下拉列表分隔符
    _separator = () => {
        return (
            <Text style={{height: 0}}></Text>
        )
    }
    // 状态选择下拉框位置
    _adjustStatus = () => {
        return ({
            right: width / 3,
            top: 99,
        })
    }
    // 分类选择下拉框位置
    _adjustType = () => {
        return ({
            right: 0,
            top: 99,
        })
    }


    //语音呼叫按钮点击事件
    _jumpAudioSession() {
        Keyboard.dismiss()
        this._SaveWriteData('audio');
        if (this.state.WriteName.indexOf('@') > 0 && this.state.WriteName.startsWith('+')) {
            this.refs.toast.show('格式错误')
        } else if (this.state.WriteName.indexOf('@') > 0 || this.state.WriteName.startsWith('+')) {
            this._chooseAudioSipCall()
        } else {
            this._chooseAudioNormalCall()
        }
    }

    //选择语音sip呼叫
    _chooseAudioSipCall() {
        Global.isSip = true;
        this.props.navigation.push('audioVC', {
            "user_name": this.state.WriteName,
            "isSip": true
        })
    }

    //选择普通语音呼叫
    _chooseAudioNormalCall() {
        Global.isSip = false;
        this.props.navigation.push('audioVC', {"user_name": this.state.WriteName, "isSip": false})
    }

    _jumpVideoSession() {
        Keyboard.dismiss()
        this._SaveWriteData('video');
        if (this.state.WriteName.indexOf('@') > 0 && this.state.WriteName.startsWith('+')) {
            this.refs.toast.show('格式错误')
        } else if (this.state.WriteName.indexOf('@') > 0 || this.state.WriteName.startsWith('+')) {
            this._chooseVideoSipCAll()
        } else {
            this._chooseVideoNormalCall()
        }
    }

    _chooseVideoSipCAll() {
        Global.isSip = true;
        this.props.navigation.push('videoVC', {
            "user_name": this.state.WriteName,
            "jsep": CommingCalljsep
        })
    }

    _chooseVideoNormalCall() {
        Global.isSip = false;
        this.props.navigation.push('videoVC', {"user_name": this.state.WriteName, "jsep": CommingCalljsep})
    }


    _jumpMeetingSession() {
        Keyboard.dismiss()
        this.props.navigation.push('MainVC', {
            "room": this.state.WriteName,
            "displayname": loginName,
            "gateway": this.state.gatewayIP
        })
        this._SaveWriteData('meet');
    }

    _SaveWriteData(callType) {
        if (this.state.WriteName.length > 0) {
            if (this.state.history.length > 0) {
                if (!this.state.history.includes(this.state.WriteName)) {
                    if (this.state.history.length > 4) {
                        this.state.history.shift()
                    }
                    const single = {"type": callType, "number": this.state.WriteName}
                    this.state.history.push(single)
                    storage.save('history', this.state.history)
                }
            } else {
                const single = {"type": callType, "number": this.state.WriteName}
                this.state.history.push(single)
                storage.save('history', this.state.history)
            }
        }
    }

    _doHang() {
        let singleton = new Singleton()
        videoCall = singleton.getVideoCall()
        sipCall = singleton.getSipcall()
        if (Global.isSip) {
            var hangup = {"request": "decline"};
            sipCall.send({"message": hangup});
            sipCall.hangup();
        } else {
            var hangup = {"request": "hangup"};
            videoCall.send({"message": hangup});
            videoCall.hangup();
        }
    }

    onBackAndroid = () => {
        if (lastBackPressed && lastBackPressed + 2000 >= Date.now()) {
            //最近2秒内按过back键，可以退出应用。
            let singleton = new Singleton()
            let janus = singleton.getJanus();
            sipCall = singleton.getSipcall()
            var unregister = {
                "request": 'unregister'
            };
            sipCall.send({
                'message': unregister
            });
            janus.destroy();
            BackHandler.exitApp();
            return;
        }
        lastBackPressed = Date.now();
        this.refs.toast.show('再按一次退出应用');
        return true;
    }
}
const styles = StyleSheet.create({
    center: {
        height: height > width ? height : width,
        position: 'absolute',
        alignItems: 'center',           
        ...Platform.select({
            ios: {
                marginTop:stateBar + 30,
            },
            android: {
                alignSelf: 'center', flex: 1,  
                justifyContent: 'center',
            }
        }),
        
    },
    dropdown_2_row_text: {
        marginHorizontal: 12,
        fontSize: 16,
        color: 'navy',
        textAlignVertical: 'center',
    },
    dropdown_2_row: {
        flexDirection: 'row',
        height: 40,
        alignItems: 'center',
    },
    dropdown_2_image: {
        borderRadius: 25,
        marginLeft: 12,
        width: 25,
        height: 25,
        ...Platform.select({
            ios: {
                borderRadius: 12.5,
                marginLeft: 12,
                width: 25,
                height: 25,
            }
        })
    },
    setGateway: {
        width: height > width ? width : height,
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        textAlignVertical: 'center',
        color: '#fff',
        position: 'absolute',
        ...Platform.select({
            ios: {
                bottom: 20,
            },
            android: {
                bottom: 30,
            }
        }),
    },
    setServerAddress: {
        width: height > width ? width : height,
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        textAlignVertical: 'center',
        color: '#fff',
        position: 'absolute',
        ...Platform.select({
            ios: {
                bottom: 43,
            },
            android: {
                bottom: 50,
            }
        }),
    },
    backStyle: {
        backgroundColor: '#fff',
        width: 70,
        height: 35,
        marginTop: 10,
        position: 'absolute',
        left: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    AlertStyle: {
        width: height > width ? width : height,
        justifyContent: 'center',
        color: 'white',
        textAlign: 'center',
        ...Platform.select({
            ios: {
                marginTop: 200,
            },
            android: {}
        })

    },
    midStyle: {
        justifyContent: 'center',
        marginTop: 10,
        height: 50,
        width: height > width ? width / 2 : height / 2,
        flexDirection: 'row',
    },
    ImageBackStyle: {
        width: 50,
        height: 50,
        backgroundColor: '#CDCDCD',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 5,
        borderBottomLeftRadius: 5,
    },
    searchStyle: {
        width: 25,
        height: 25,
    },
    InputStyle: {
        width: height > width ? width / 2 : height / 2,
        height: 50,
        backgroundColor: 'white',
        borderColor: '#CDCDCD',
        borderWidth: 1,
    },
    listStyle: {
        // justifyContent: 'center',
        // alignItems: 'center',
        // alignSelf: 'center',

        borderRadius: 5,
        
        backgroundColor: 'white',
        borderColor: '#CDCDCD',
        borderWidth: 1,
        marginTop: 0,
        ...Platform.select({
            ios: {
                width: height > width ? width - 85 : height - 85,
            },
            android: {
                width: height > width ? width - 60 : height - 60,
            }
        })
        
    },
    RightBackStyle: {
        alignSelf: 'center',
        marginTop: 0,
        width: 50,
        height: 50,
        borderTopRightRadius: 5,
        borderBottomRightRadius: 5,
        backgroundColor: '#CDCDCD',
        alignItems: 'center',
        justifyContent: 'center',
    },
    BottomStyle: {
        marginTop: 20,
        height: 50,
        width: height > width ? width - 20 : height - 20,
        flexDirection: 'row',
        justifyContent: 'center'
        
    },
    iconViewStyle: {
        width: 50,
        height: 50,
        marginLeft: 15,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#96C11F'
    },
    unable: {
        width: 50,
        height: 50,
        marginLeft: 15,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#bbb'
    },
    iconStyle: {
        width: 25,
        height: 25,
    },
})

const styles2 = StyleSheet.create({
    center: {
        height: height > width ? width : height,
        position: 'absolute',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                marginTop:stateBar + 30,
            },
            android: {
                alignSelf: 'center', flex: 1,
                justifyContent: 'center',
            }
        }),
    },
    listStyle: {
        borderRadius: 5,
        width: height > width ? width - 60 : height - 60,
        marginRight: 50,
        backgroundColor: 'white',
        borderColor: '#CDCDCD',
        borderWidth: 1,
        marginTop: 0,
        ...Platform.select({
            ios: {
                marginRight: 0,
                width: height > width ? width - 85 : height - 85,
            }
        })

    },
    setGateway: {
        width: height > width ? height - 50 : width - 50,
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        textAlignVertical: 'center',
        height: 20,
        color: '#fff',
        position: 'absolute',
        marginLeft: 20,
        fontSize: 14,
        ...Platform.select({
            ios: {
                bottom: 40,
            },
            android: {
                bottom: 10,
            }
        })
    },
    setServerAddress: {
        width: height > width ? height - 50 : width - 50,
        textAlign: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        textAlignVertical: 'center',
        color: '#fff',
        position: 'absolute',
        marginLeft: 20,
        height: 20,
        fontSize: 14,
        ...Platform.select({
            ios: {
                bottom: 60,
            },
            android: {
                bottom: 30,
            }
        })
    },
    backStyle: {
        backgroundColor: '#fff',
        width: 70,
        height: 35,
        marginTop: 10,
        position: 'absolute',
        left: 15,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 6,
    },
    AlertStyle: {
        width: height > width ? width : height,
        justifyContent: 'center',
        color: 'white',
        fontSize: 16,
        textAlign: 'center',
        ...Platform.select({
            ios: {
                marginTop: 30,
            }
        })
    },
    midStyle: {
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 20,
        height: 50,
        width: height > width ? width / 2 : height / 2,
        flexDirection: 'row',
    },
    ImageBackStyle: {
        width: 50,
        height: 50,
        backgroundColor: '#CDCDCD',
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 5,
        borderBottomLeftRadius: 5,
    },
    searchStyle: {
        width: 25,
        height: 25,
    },
    InputStyle: {
        alignSelf: 'center',
        alignItems: 'center',
        justifyContent: 'center',
        width: height > width ? width / 2 : height / 2,
        height: 50,
        backgroundColor: 'white',
        borderColor: '#CDCDCD',
        borderWidth: 1,
    },
    RightBackStyle: {
        width: 50,
        height: 50,
        borderTopRightRadius: 5,
        borderBottomRightRadius: 5,
        backgroundColor: '#CDCDCD',
        alignItems: 'center',
        justifyContent: 'center',
        ...Platform.select({
            ios: {
                marginTop: 0,
            }
        })

    },
    BottomStyle: {
        marginTop: 20,
        height: 50,
        width: height > width ? height - 20 : width - 20,
        flexDirection: 'row',
        justifyContent: 'center'
    },
    iconStyle: {
        width: 25,
        height: 25,
    },
})


//带参数的POST请求
function postRequest(url, data, callback) {
    let opts = {
        method: 'POST',
        headers: {
            'Accept': 'application/json'
        },
        body: data
    }

    fetch(url, opts)
        .then((resonse) => resonse.text())
        .then((responseText) => {
            //将返回的JSON字符串转成JSON对象，并传递到回调方法中
            callback(JSON.parse(responseText));
        });
}
