import React, {Component} from 'react'
import {
    AppState,
    Button,
    DeviceEventEmitter,
    Dimensions,
    Image,
    ImageBackground,
    Platform,
    StatusBar,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import {storage} from '../storageUtil'
import IdleTimerManager from 'react-native-idle-timer';
import Orientation from "react-native-orientation";
import Global from "../Global";
import Toast from "react-native-easy-toast";
//图片选择器
var {width, height} = Dimensions.get('window')
let firstClick = 0;
var IsIOS = Platform.OS === 'ios' ? 1 : 0
var isIphoneX = ((IsIOS) && (height >= 812)) ? 1 : 0
let editAble = false
var keyboaedShow = false
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
            falseSwitchIsOn: false,
            gpsIP: '',
            gpsIPCar: '',
            Keyshow: false

        }
        this.handleAppStateChange = this.handleAppStateChange.bind(this)
    }

    _orientationDidChange = (ori) => {
        console.info("切换了" + ori)
        this.setState({
            curOrt: ori
        });
    }

    componentWillMount() {
        StatusBar.setHidden(false, 'slide')
        AppState.addEventListener('change', this.handleAppStateChange);
        IdleTimerManager.setIdleTimerDisabled(true);
        this.setState({
            curOrt: Global.orientationStr
        })
        let {editable} = this.props.navigation.state.params;
        editAble = editable;
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
        AppState.removeEventListener('change', this.handleAppStateChange);
        Orientation.removeOrientationListener(this._orientationDidChange);
        IdleTimerManager.setIdleTimerDisabled(false);
    }

    componentDidMount() {
        Global.currentPage = 'Setting'
        Orientation.addOrientationListener(this._orientationDidChange);
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
        storage.load("falseSwitchIsOn", (PhoneNumber) => {
            if (typeof PhoneNumber == 'boolean') {
                this.setState({
                    falseSwitchIsOn: PhoneNumber
                })
            }
        })
        storage.load('gpsAddress', (ip) => {
            if (ip.length > 0) {
                this.setState({
                    gpsIP: ip
                })
            }
        })

        storage.load('gpsAddress2', (ipCar) => {
            if (ipCar.length > 0) {
                this.setState({
                    gpsIPCar: ipCar
                })
            }
        })
    };

    render() {
        let v = editAble ? null : <View style={(this.state.curOrt == 'PORTRAIT') ? styles.LogView : styles2.LogView}>
            <View style={styles.RegistBacView}>
                <Button
                    color={IsIOS ? 'white' : 'orange'}
                    style={styles.LogAction}
                    title="注销"
                    onPress={() => {
                        this.logout()
                    }}
                />
            </View>

        </View>;
        return (
            
            <View
                style={(this.state.curOrt == 'PORTRAIT') ? ((this.state.Keyshow && IsIOS)? styles.ViewStyleios : styles.ViewStyle) : ((this.state.Keyshow && IsIOS) ? styles2.ViewStyleios : styles2.ViewStyle2)}>
                <ImageBackground source={require('../icon/back.png')}
                                 style={(this.state.curOrt == 'PORTRAIT') ? styles.ViewStyle2 : styles2.ViewStyle2}>
                    <View style={(this.state.curOrt == 'PORTRAIT') ? styles.backIcon : styles2.backIcon}>
                        <TouchableOpacity
                            onPress={() => {
                                if (this.state.ip.length > 0 && this.state.gateway.length > 0) {
                                    storage.save("ip", this.state.ip);
                                    storage.save("gateway", this.state.gateway);
                                    storage.save("gpsAddress", this.state.gpsIP)
                                    storage.save("gpsAddress2", this.state.gpsIPCar)
                                    storage.save("iceserver", this.state.iceserver)
                                    if (!editAble) {
                                        Global.currentPage = 'CallVC'
                                    } else {
                                        Global.currentPage = 'Login'
                                    }
                                    if (this.state.curOrt == 'LANDSCAPE') {
                                        StatusBar.setHidden(true, 'slide')
                                    } else {
                                        StatusBar.setHidden(false, 'slide')
                                    }
                                    this.props.navigation.goBack()
                                } else {
                                    if (!IsIOS) {
                                        this.refs.toast.show('请检查格式');
                                    }
                                }
                            }}
                        >
                            <View style={{
                                left: 20,
                                top: 20,
                                width: 100,
                                height: 100,
                                alignSelf: 'flex-start',
                            }}>
                                <Image source={require('../icon/ic_arrow_back_white_48dp.png')}
                                       style={{width: 30, height: 30, alignSelf: 'flex-start'}}/>
                            </View>
                        </TouchableOpacity>
                    </View>


                    <View style={(this.state.curOrt == 'PORTRAIT') ? styles.settingCenter : styles2.settingCenter}>

                        <Text
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.setServerAddress : styles2.setServerAddress}>会议服务器:</Text>
                        <TextInput
                            editable={editAble}
                            placeholderTextColor='white'
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.accountStyle : styles2.accountStyle}
                            onChangeText={(text) => {
                                this.setState({
                                    ip: text
                                })
                            }}
                        >{this.state.ip}</TextInput>
                        <Text
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.setGateway : styles2.setGateway}>网关:</Text>
                        <TextInput
                            editable={editAble}
                            placeholderTextColor='white'
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.accountStyle : styles2.accountStyle}
                            onChangeText={(text) => {
                                this.setState({
                                    gateway: text
                                })
                            }}
                        >{this.state.gateway}</TextInput>

                        <Text
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.setGateway : styles2.setGateway}>iceServers:</Text>
                        <TextInput
                            editable={editAble}
                            placeholderTextColor='white'
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.accountStyle : styles2.accountStyle}
                            onChangeText={(text) => {
                                this.setState({
                                    iceserver: text
                                })
                            }}
                        >{this.state.iceserver}</TextInput>

                        <Text
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.setGateway : styles2.setGateway}>指挥调度平台:</Text>
                        <TextInput
                            placeholderTextColor='white'
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.accountStyle : styles2.accountStyle}
                            onChangeText={(text) => {
                                this.setState({
                                    gpsIP: text
                                })
                            }}

                            onFocus={() => {
                                this.setState({
                                    Keyshow: true
                                })
                            }}
                            onEndEditing={() => {
                                this.setState({
                                    Keyshow: false
                                })
                            }}


                        >{this.state.gpsIP}</TextInput>
                        <Text
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.setGateway : styles2.setGateway}>指挥车:</Text>
                        <TextInput
                            placeholderTextColor='white'
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.accountStyle : styles2.accountStyle}
                            onChangeText={(text) => {
                                this.setState({
                                    gpsIPCar: text
                                })
                            }}
                            onFocus={() => {
                                this.setState({
                                    Keyshow: true
                                })
                            }}
                            onEndEditing={() => {
                                this.setState({
                                    Keyshow: false
                                })
                            }}
                        >{this.state.gpsIPCar}</TextInput>
                        <View style={(this.state.curOrt == 'PORTRAIT') ? styles.autoStyle : styles2.autoStyle}>
                            <Text
                                style={(this.state.curOrt == 'PORTRAIT') ? styles.Accept : styles2.Accept}>自动接听:</Text>
                            <Switch
                                onValueChange={(value) => {
                                    this.setState({
                                        falseSwitchIsOn: value
                                    });
                                    storage.save("falseSwitchIsOn", value);
                                }}
                                style={{left: 10}}
                                value={this.state.falseSwitchIsOn}/>
                        </View>
                        {v}
                    </View>


                    <Toast ref="toast" fadeOutDuration={0}/>
                </ImageBackground>
            </View>
            
        )
    }

    logout() {
        Global.currentPage = 'Login'
        if (this.state.curOrt == 'LANDSCAPE') {
            StatusBar.setHidden(true, 'slide')
        } else {
            StatusBar.setHidden(false, 'slide')
        }
        this.props.navigation.goBack()
        DeviceEventEmitter.emit('logout', "");
    }
}
const styles = StyleSheet.create({
    settingCenter: {
        height: height > width ? height - 20 : width - 20,
        position: 'absolute',
        alignSelf: 'center', flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    containerStyle: {
        marginTop: -30
    },
    autoStyle: {
        width: height > width ? width / 1.5 : height / 1.5,
        flexDirection: 'row',
        marginTop: 20,
    },
    backIcon: {
        width: height > width ? width : height,
        position: "absolute",
        flexDirection: 'row',
        marginTop: isIphoneX ? 20 : 0
    },
    setServerAddress: {
        fontSize: 16,
        color: '#fff',
        width: height > width ? width / 1.5 : height / 1.5,
    },
    setGateway: {
        fontSize: 16,
        color: '#fff',
        width: height > width ? width / 1.5 : height / 1.5,
        marginTop: 20
    },
    ViewStyle: {
        width: height > width ? width : height,
        height: height > width ? height : width,
        alignItems: 'center',
        backgroundColor: 'black',
        ...Platform.select({
            ios: {}
        })
    },
    ViewStyleios:{
        width: height > width ? width : height,
        height: height > width ? height : width,
        alignItems: 'center',
        backgroundColor: 'black',
        marginTop: - 80,
    },

    ViewStyle2: {
        width: height > width ? width : height,
        height: height > width ? height : width,
        alignItems: 'center',
    },
    HeaderStyle: {
        width: 100,
        height: 100,
        marginTop: 40,
        borderWidth: 1,
        borderColor: '#CDCDCD',
        borderRadius: 50,
        backgroundColor: '#f1f1f1',
    },
    NameStyle: {
        marginTop: 10,
        fontSize: 20,
        marginBottom: 30,
        color: 'white',
        justifyContent: 'center',
        fontWeight: '900',
    },
    accountStyle: {
        color: '#ffffff',
        fontSize: 15,
        borderBottomColor: '#CDCDCD',
        borderBottomWidth: 1,
        height: 40,
        width: height > width ? width / 1.5 : height / 1.5,
    },
    LogView: {
        color: '#ffffff',
        marginTop: 30,
        height: 50,
        width: height > width ? width / 3 : height / 3,
        // justifyContent:'center'
        ...Platform.select({
            ios: {
                alignItems:'center'
            }
        })
        
    },
    LogAction: {
        height: height > width ? height : width,
        width: height > width ? width - 150 : height - 150,
        fontSize: 15,
        // justifyContent:'center',
        textAlign: 'center',
        ...Platform.select({
            ios: {
                backgroundColor: 'orange',
                color: 'white'
            }
        })
    },
    Accept: {
        fontSize: 15,
        color: '#fff',
        ...Platform.select({
            ios: {
                // marginLeft:10,
            }
        })
    },
    contain: {
        fontSize: 13,
        color: '#CDCDCD',
    },
    backgroundImage: {},
    RegistBacView: {
        ...Platform.select({
            ios: {
                backgroundColor: 'orange',
                height: 40,
                width: height > width ? width - 150 : height - 150,
                fontSize: 15,
                borderRadius: 5,
            }
        })


    }
})

const styles2 = StyleSheet.create({
    settingCenter: {
        height: height > width ? width - 20 : height - 20,
        position: 'absolute',
        alignSelf: 'center', flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    autoStyle: {
        width: height > width ? height / 3 : width / 3,
        flexDirection: 'row',
        marginTop: 10,
    },
    backIcon: {
        width: height > width ? height : width,
        position: "absolute",
        flexDirection: 'row',
        marginTop: isIphoneX ? 20 : 0,
    },
    setServerAddress: {
        fontSize: 14,
        color: '#fff',
        width: height > width ? height / 3 : width / 3,
    },
    setGateway: {
        fontSize: 14, color: '#fff', width: height > width ? height / 3 : width / 3, marginTop: 7
    },
    ViewStyle: {
        width: height > width ? width : height,
        height: height > width ? height : width,
        alignItems: 'center',
        backgroundColor: 'black',
    },
    ViewStyle2: {
        width: height > width ? height : width,
        height: height > width ? width : height,
        alignItems: 'center',
    },
    ViewStyleios: {

        marginTop: -80,
        width: height > width ? height : width,
        height: height > width ? width : height,
        alignItems: 'center',

    },

    HeaderStyle: {
        width: 100,
        height: 100,
        marginTop: 40,
        borderWidth: 1,
        borderColor: '#CDCDCD',
        borderRadius: 50,
        backgroundColor: '#f1f1f1',
    },
    NameStyle: {
        marginTop: 10,
        fontSize: 20,
        marginBottom: 30,
        color: 'white',
        justifyContent: 'center',
        fontWeight: '900',
    },
    accountStyle: {
        height: 18,
        color: '#ffffff',
        fontSize: 14,
        borderBottomColor: '#CDCDCD',
        borderBottomWidth: 1,
        width: height > width ? height / 3 : width / 3,
        paddingTop: 0,
        paddingBottom: 0,
        ...Platform.select({
            ios: {
                height: 30,
            }
        })

    },
    Accept: {
        fontSize: 15,
        color: '#fff',
        
    },

    LogView: {
        color: '#ffffff',
        height: 40,
        width: height > width ? width / 3 : height / 3,
        marginTop: 10,
        ...Platform.select({
            ios: {
                alignItems:'center'
            }
        })
    },
    LogAction: {
        height: height > width ? height : width,
        width: height > width ? width / 3 : height / 3,
        fontSize: 15,
        // justifyContent:'center',
        textAlign: 'center',
        ...Platform.select({
            ios: {
                backgroundColor: 'orange',
                color: 'white'

            }
        })
    },
    contain: {
        fontSize: 13,
        color: '#CDCDCD',
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
