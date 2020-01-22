import React, {Component} from 'react'
import {
    AppRegistry,
    AppState,
    Button,
    DeviceEventEmitter,
    Dimensions,
    Image,
    ImageBackground,
    NativeModules,
    NetInfo,
    PermissionsAndroid,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {Geolocation, init} from "react-native-amap-geolocation";

import Singleton from './Singleton'
import {storage} from '../storageUtil'
import IdleTimerManager from 'react-native-idle-timer';
import Orientation from 'react-native-orientation';
import Global from "../Global";
import Toast from "react-native-easy-toast";
import {EasyLoading, Loading} from 'react-native-easy-loading';

//图片选择器
var {width, height} = Dimensions.get('window')
var isIOS = Platform.OS === 'ios' ? 1 : 0
var isIphoneX = (isIOS && height >= 812 && width >= 375) ? 1 : 0
var stateBar = isIphoneX ? 44 : 20
let firstClick = 0;
let tag = true;
let hasInternet;
const device = {};
// if (!isIOS) {
//     import DeviceInfo from 'react-native-device-info';
// }

export default class componentName extends Component {
    static navigationOptions = {
        tabBarVisible: false, // 隐藏底部导航栏
        header: null,  //隐藏顶部导航栏
    };

    constructor(props) {
        super(props)
        this.state = {
            ip: '',
            gateway: '',
            iceserver: '',
            UserName: '',
            PassWord: '',
            curOrt: 'PORTRAIT',
            versionName: '',
            versionCode: '',
        }
        this.handleAppStateChange = this.handleAppStateChange.bind(this)
    }

    componentWillMount() {
        // if (!isIOS) {
        //     device.UserAgent = DeviceInfo.getUserAgent();
        //     device.DeviceBrand = DeviceInfo.getBrand();
        //     device.DeviceModel = DeviceInfo.getModel();
        //     device.SystemVersion = DeviceInfo.getSystemVersion();
        //     device.AppVersion = DeviceInfo.getVersion();
        //     device.AppReadableVersion = DeviceInfo.getReadableVersion();   
        // }
        
        console.info("设备型号：" + device.DeviceModel)
        AppState.addEventListener('change', this.handleAppStateChange);
        if (!isIOS) {
            NativeModules.VersionModule.getVersionInfo((callback) => {
                let parse = JSON.parse(callback);
                this.setState({
                    versionName: parse.versionName,
                    versionCode: parse.versionCode,
                })
            })
        } else {
            this.setState({
                versionName: '1.0.9'
            })
        }
        IdleTimerManager.setIdleTimerDisabled(true);
        NetInfo.fetch().done((status) => {
            hasInternet = status;
        });
        //监听网络状态改变
        NetInfo.addEventListener('change', this.handleConnectivityChange);
    }

    handleConnectivityChange(status) {
        if (status == 'NONE') {
            hasInternet = false;
        } else {
            hasInternet = true;
        }
        console.log('网络状态：' + hasInternet);
    }

    handleAppStateChange(appState) {
        if (appState == 'active') {
            Orientation.getOrientation((err, orientation) => {
                Global.orientationStr = orientation;
                this.setState({
                    curOrt: orientation
                })
            });
        }
    }

    componentWillUnmount() {
        AppState.removeEventListener('change', this.handleAppStateChange);
        let singleton = new Singleton();
        let janus = singleton.getJanus();
        if (janus) {
            janus.destroy()
        }
        Orientation.removeOrientationListener(this._orientationDidChange);
        IdleTimerManager.setIdleTimerDisabled(false);
        NetInfo.removeEventListener('change', this.handleConnectivityChange);
    }

    _orientationDidChange = (ori) => {
        console.info("切换了" + ori)
        this.setState({
            curOrt: ori
        });
        Global.orientationStr = ori;
    }

    async componentDidMount() {
        await init({
            ios: "6f169283ffa0563e9284c3a6acb1885c",
            android: "83250189ac5894fbcdc188c25ac0dddf"
        });
        if (width > height) {
            Orientation.getOrientation((err, orientation) => {
                Global.orientationStr = orientation;
                this.setState({
                    curOrt: orientation
                })
            });
        }
        Global.currentPage = 'Login'
        Orientation.addOrientationListener(this._orientationDidChange);
        this.deEmitter = DeviceEventEmitter.addListener('login', (a) => {
            if (a == 'success' && Global.currentPage == 'Login') {
                EasyLoading.dismis('登录中...', 'type');
                this.props.navigation.push('Call', {
                    username: this.state.UserName,
                    password: this.state.PassWord,
                    ip: this.state.ip
                })
            } else if (a.indexOf("Lost connection") >= 0 || a.indexOf('server down') >= 0
                || a.indexOf("Is the gateway down") >= 0 || a.indexOf('already taken') >= 0) {
                // if (Global.currentPage == 'CallVC') {
                this.relogin()
                // } else {
                //     EasyLoading.dismis('登录中...', 'type');
                //     this.refs.toast.show(a)
                // }
            } else if (a.indexOf('success').length < 0) {
                EasyLoading.dismis('登录中...', 'type');
                this.refs.toast.show(a)
            }
        });
        storage.load("username", (PhoneNumber) => {
            if (PhoneNumber.length > 0) {
                this.setState({
                    UserName: PhoneNumber
                })
            }
        })
        storage.load("ip", (PhoneNumber) => {
            if (PhoneNumber.length > 0) {
                this.setState({
                    ip: PhoneNumber
                })
            } else {
                this.setState({
                    ip: '127.0.0.1'
                })
            }
        })
        storage.load("password", (PhoneNumber) => {
            if (PhoneNumber.length > 0) {
                this.setState({
                    PassWord: PhoneNumber
                })
            }
        })
        storage.load("gateway", (PhoneNumber) => {
            if (PhoneNumber.length > 0) {
                this.setState({
                    gateway: PhoneNumber
                })
            }
        })
        storage.load("iceserver", (PhoneNumber) => {
            if (PhoneNumber.length > 0) {
                this.setState({
                    iceserver: PhoneNumber
                })
            } else {
                this.setState({
                    iceserver: 'stun:stun.stunprotocol.org:3478'
                })
            }
        })
    };

    render() {
        console.info("宽：" + width + " -- 高：" + height + " -- " + this.state.curOrt)
        return (
           
            <View style={(this.state.curOrt == 'PORTRAIT') ? styles.ViewStyle : styles2.ViewStyle2}>
                <ImageBackground source={require('../icon/back.png')}
                                 style={(this.state.curOrt == 'PORTRAIT') ? styles.ViewStyle : styles2.ViewStyle2}>
                    <View style={{
                        marginTop: 20,
                        alignSelf: 'flex-end',
                        position: 'absolute',
                    }}>
                        <TouchableOpacity
                            onPress={() => {
                                this.props.navigation.push('Setting', {
                                    editable: true
                                })
                            }}
                        >
                            <View style={(this.state.curOrt == 'PORTRAIT') ? styles.setIcon : styles2.setIcon}>
                                <Image source={require('../icon/ic_settings_white_48dp.png')}
                                       style={{width: 30, height: 30, alignSelf: 'flex-end'}}/>
                            </View>
                        </TouchableOpacity>
                    </View>
                    <View style={{
                        alignSelf: 'center', flex: 1,
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        <View>
                            <Image source={require('../icon/con_logo.png')}
                                   style={(this.state.curOrt == 'PORTRAIT') ? styles.HeaderStyle : styles2.HeaderStyle}/>
                        </View>
                        <Text
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.NameStyle : styles2.NameStyle}>指挥调度客户端</Text>
                        <TextInput
                            placeholder='账号'
                            placeholderTextColor='white'
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.accountStyle : styles2.accountStyle}
                            onChangeText={(text) => {
                                this.setState({
                                    UserName: text
                                })
                            }}
                        >{this.state.UserName}</TextInput>
                        <TextInput
                            secureTextEntry={true}
                            placeholder='密码'
                            placeholderTextColor='white'
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.accountStyle : styles2.accountStyle}
                            onChangeText={(text) => {
                                this.setState({
                                    PassWord: text
                                })
                            }}
                        >{this.state.PassWord}</TextInput>
                        <View style={(this.state.curOrt == 'PORTRAIT') ? styles.LogView : styles2.LogView}>
                            <Button
                                color={isIOS ? 'white' : 'orange'}
                                style={styles.LogAction}
                                title="登录"
                                onPress={() => {
                                    EasyLoading.show('登录中...', -1, 'type');
                                    storage.load("ip", (PhoneNumber) => {
                                        if (PhoneNumber.length > 0) {
                                            this.setState({
                                                ip: PhoneNumber
                                            })
                                            storage.load("gateway", (PhoneNumber) => {
                                                if (PhoneNumber.length > 0) {
                                                    this.setState({
                                                        gateway: PhoneNumber
                                                    })
                                                    console.info("登陆ip和gateway：" + this.state.ip + " --" + this.state.gateway)
                                                    if (this.state.UserName.length > 0 && this.state.ip.length > 0 && this.state.gateway.length > 0) {
                                                        if (isIOS) {
                                                            // this.checkDeviceGPS()
                                                            this.toLogin()
                                                        } else {
                                                            this.isGPSOpen()
                                                        }
                                                    } else {
                                                        this.refs.toast.show('请检查输入');
                                                        EasyLoading.dismis('登录中...', 'type');
                                                    }
                                                } else {
                                                    this.refs.toast.show('请检查输入');
                                                    EasyLoading.dismis('登录中...', 'type');
                                                }
                                            })
                                        } else {
                                            this.refs.toast.show('请检查输入');
                                            EasyLoading.dismis('登录中...', 'type');
                                        }
                                    })
                                }}
                            />
                        </View>
                        <Text style={styles.contain}>©天地阳光(v{this.state.versionName}) </Text>
                    </View>

                    <Toast ref="toast" fadeOutDuration={0}/>
                    <Loading type={"type"}
                             loadingStyle={(this.state.curOrt == 'PORTRAIT') ? {
                                 backgroundColor: "#000",
                                 position: 'absolute',
                                 alignSelf: 'center',
                                 // justifyContent: 'center',
                                 // alignItems: 'center',
                                 bottom: height > width ? height / 2.5 : width / 2.5,
                             } : {
                                 backgroundColor: "#000",
                                 alignSelf: 'center',
                                 // justifyContent: 'center',
                                 // alignItems: 'center',
                                 position: 'absolute',
                                 bottom: height > width ? width / 2.5 : height / 2.5,
                             }}/>
                </ImageBackground>
            </View>
            
        )
    }

    handleDoubleClick() {
        var timestamp = (new Date()).valueOf();
        if (timestamp - firstClick > 300) {
            firstClick = timestamp;
        } else {
            this._show()
        }
    }

    _show = () => {
        this.refs.RNAlert && this.refs.RNAlert.show('GPS上传地址', '');
    }

    _sure = () => {
    }

    isGPSOpen() {
        this.checkPermission()
    }

    checkDeviceGPS() {
        //适配威海德设备
        if (device.DeviceModel.indexOf('c4pro') > -1 || device.DeviceModel.indexOf('c4z') > -1) {
            EasyLoading.dismis('登录中...', 'type');
            Geolocation.getCurrentPosition(
                position => this.toLogin(),
                error => this.refs.toast.show("请打开GPS"),
            );
        } else {
            // 判断是否打开gps
            NativeModules.GpsModule.isopen((success) => {
                if (success.indexOf("true") == -1) {
                    EasyLoading.dismis('登录中...', 'type');
                    this.refs.toast.show("请打开GPS")
                    NativeModules.GpsModule.jump()
                } else {
                    this.toLogin()
                }
            })
        }
    }

    toLogin() {
        storage.save("username", this.state.UserName);
        storage.save("password", this.state.PassWord);
        let singleton = new Singleton()
        singleton.initJanus(this.state.UserName, this.state.PassWord, this.state.ip, this.state.gateway, this.state.iceserver)
    }

    relogin() {
        if (tag) {
            tag = false
            this.interval = setInterval(() => {
                console.info("重新注册中 --" + Global.isConnected)
                if (hasInternet) {
                    if (!Global.isConnected) {
                        let singleton = new Singleton()
                        let janus = singleton.getJanus();
                        let videoCall = singleton.getVideoCall();
                        if (videoCall) {
                            videoCall.clearMySession();
                        }
                        if (janus) {
                            janus.destroy()
                        }
                        singleton.initJanus(this.state.UserName, this.state.PassWord, this.state.ip, this.state.gateway, this.state.iceserver)
                        console.info("重连 ++")
                    } else {
                        tag = true
                        console.info("关闭循环 ++")
                        clearInterval(this.interval)
                        DeviceEventEmitter.emit('login', "success");
                    }
                }
            }, 2000);
        }
    }

    checkPermission() {
        try {
            //返回Promise类型
            const granted = PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.CAMERA, PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION, PermissionsAndroid.PERMISSIONS.RECORD_AUDIO)
            granted.then((data) => {
                if (data) {
                    this.checkDeviceGPS()
                } else {
                    this.requestMultiplePermission()
                }
            }).catch((err) => {
                EasyLoading.dismis('登录中...', 'type');
                this.refs.toast.show(err + "");
            })
        } catch (err) {
            EasyLoading.dismis('登录中...', 'type');
            this.refs.toast.show(err + "");
        }
    }

    async requestMultiplePermission() {
        try {
            const permissions = [
                PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
                PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
                PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
                PermissionsAndroid.PERMISSIONS.CAMERA,
                PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            ]
            //返回得是对象类型
            const granteds = await PermissionsAndroid.requestMultiple(permissions)
            var data = "是否同意地址权限: "
            if (granteds["android.permission.ACCESS_FINE_LOCATION"] === "granted") {
                data = data + "true\n"
            } else {
                data = data + "false\n"
            }
            data = data + "是否同意GPS权限: "
            if (granteds["android.permission.ACCESS_COARSE_LOCATION"] === "granted") {
                data = data + "true\n"
            } else {
                data = data + "false\n"
            }
            data = data + "是否同意相机权限: "
            if (granteds["android.permission.CAMERA"] === "granted") {
                data = data + "true\n"
            } else {
                data = data + "false\n"
            }
            data = data + "是否同意存储权限: "
            if (granteds["android.permission.WRITE_EXTERNAL_STORAGE"] === "granted") {
                data = data + "true\n"
            } else {
                data = data + "false\n"
            }
            if (data.indexOf("false") == -1) {
                this.checkDeviceGPS()
            }
        } catch (err) {
            console.info("\n\n经纬度报错  ---" + err.toString())
        }
    }
}

const styles2 = StyleSheet.create({
    ViewStyle2: {
        width: height > width ? height : width,
        height: height > width ? width : height,
        alignItems: 'center',
    },
    HeaderStyle: {
        width: 80,
        height: 70,
    },
    NameStyle: {
        marginTop: 2,
        fontSize: 18,
        marginBottom: 15,
        color: 'white',
        justifyContent: 'center',
    },
    accountStyle: {
        color: '#ffffff',
        fontSize: 13,
        borderBottomColor: '#CDCDCD',
        borderBottomWidth: 1,
        height: 40,
        width: height > width ? width / 2 : height / 2
    },
    LogView: {
        color: '#ffffff',
        marginTop: 10,
        height: 40,
        width: height > width ? width / 2 : height / 2,
        ...Platform.select({
            ios: {
                backgroundColor: 'orange',
                borderRadius: 5,
                height: 40,
                alignContent: "center",
            }
        })
    },
    LogAction: {
        height: height > width ? height : width,
        width: height > width ? width / 2 : height / 2,
        fontSize: 15,
        textAlign: 'center',
        ...Platform.select({
            ios: {
                lineHeight: height,

            },
        })
    },
    contain: {
        fontSize: 13,
        color: '#CDCDCD',

        ...Platform.select({
            ios: {
                marginTop: 20,

            },
        })
    },
    setIcon: {
        top: isIphoneX ? stateBar : 0,
        right: 20,
        width: 60,
        height: 60,
        alignSelf: 'flex-end',
        // backgroundColor: '#fff',
        // ...Platform.select({
        //     ios: {
        //         top: isIphoneX ? stateBar : 0,
        //     },
        // })
    },
    backgroundImage: {},
})


const styles = StyleSheet.create({
    ViewStyle: {
        width: height > width ? width : height,
        height: height > width ? height : width,
        alignItems: 'center',
    },
    setIcon: {
        top: isIphoneX ? stateBar : 0,
        right: 20,
        width: 100,
        height: 100,
        alignSelf: 'flex-end',
        // backgroundColor: '#fff',
    },
    ViewStyle2: {
        width: height > width ? height : width,
        height: height > width ? width : height,
        alignItems: 'center',
    },
    HeaderStyle: {
        width: 80,
        height: 70,
    },
    NameStyle: {
        marginTop: 15,
        fontSize: 20,
        marginBottom: 30,
        color: 'white',
        justifyContent: 'center',
    },
    accountStyle: {
        color: '#ffffff',
        fontSize: 15,
        borderBottomColor: '#CDCDCD',
        borderBottomWidth: 1,
        height: 50,
        width: height > width ? width / 2 : height / 2
    },
    LogView: {
        color: '#ffffff',
        marginTop: 50,
        height: 50,
        width: height > width ? width / 2 : height / 2,
        justifyContent: "center",
        ...Platform.select({
            ios: {
                backgroundColor: 'orange',
                borderRadius: 5,
                height: 40,
            },
        })
    },
    LogAction: {
        height: 40,
        width: height > width ? width / 2 : height / 2,
        fontSize: 15,
        textAlign: 'center',
        ...Platform.select({
            ios: {
                lineHeight: height,

            },
        })
    },
    contain: {
        fontSize: 13,
        color: '#CDCDCD',
        ...Platform.select({
            ios: {
                marginTop: 10,

            },
        })
    },
    backgroundImage: {
        // position: 'absolute',
        // flex:1,
        // alignItems:'center',
        // justifyContent:'center',
        // width:null,
        // height:null,
        // //不加这句，就是按照屏幕高度自适应
        // //加上这几，就是按照屏幕自适应
        // resizeMode:Image.resizeMode.contain,
        // //祛除内部元素的白色背景
        // backgroundColor:'rgba(0,0,0,0)',
    }
})

