import React, {Component} from 'react'
import {
    AppState,
    DeviceEventEmitter,
    Dimensions,
    Image,
    ImageBackground,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import InCallManager from "react-native-incall-manager";
import Orientation from "react-native-orientation";
import Global from "../Global";

var {width, height} = Dimensions.get('window')
const [left, top] = [0, 0];
export default class componentName extends Component {
    constructor(props) {
        super(props)
        this.state = {
            hiden: true,
            title: '',
            cancleTitle: '',
            sureTitle: '',
            curOrt: 'PORTRAIT',
        }
        this.callback = function () {
        };//回调方法
        this.handleAppStateChange = this.handleAppStateChange.bind(this)
    }

    _orientationDidChange = (ori) => {
        console.info("切换了" + ori)
        this.setState({
            curOrt: ori
        });
    }

    componentWillUnmount() {
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

    componentWillMount() {
        AppState.addEventListener('change', this.handleAppStateChange);
        this.state.curOrt = Global.orientationStr;
    }

    componentDidMount() {
        Orientation.addOrientationListener(this._orientationDidChange);
        this.deEmitter = DeviceEventEmitter.addListener('onmessage', (msg, jsep) => {
            let result = msg["result"];
            if (result !== null && result !== undefined) {
                let event = result["event"];
                if (event !== undefined && event !== null) {
                    if (event === 'hangup') {
                        InCallManager.stopRingtone()
                        this.hiden()
                    }
                }
            }
        });
    }

    render() {
        if (this.state.hiden) {
            return (
                <View>

                </View>
            )
        } else {
            InCallManager.startRingtone()
            return (
                <View style={(this.state.curOrt == 'PORTRAIT') ? styles.BackView : styles2.BackView}>
                    <ImageBackground source={require('../icon/back.png')}
                                     style={(this.state.curOrt == 'PORTRAIT') ? styles.BackView : styles2.BackView}>
                        <Text
                            style={(this.state.curOrt == 'PORTRAIT') ? styles.titleStyle : styles2.titleStyle}>{this.state.title}</Text>
                        <View style={(this.state.curOrt == 'PORTRAIT') ? styles.Action : styles2.Action}>
                            <View>
                                <View style={{width: 45, height: 45, alignSelf: 'center'}}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            InCallManager.stopRingtone()
                                            this.ClcickAction(0)
                                        }}
                                    >
                                        <Image source={require('../icon/hangup.png')}
                                               style={{width: 45, height: 45, alignSelf: 'center'}}/>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.Left}>拒绝</Text>
                            </View>
                            <View style={{marginLeft: 70}}>
                                <View style={{width: 45, height: 45, alignSelf: 'center'}}>
                                    <TouchableOpacity
                                        onPress={() => {
                                            InCallManager.stopRingtone()
                                            this.ClcickAction(1)
                                        }}
                                    >
                                        <Image source={require('../icon/accept.png')}
                                               style={{width: 45, height: 45, alignSelf: 'center'}}/>
                                    </TouchableOpacity>
                                </View>
                                <Text style={styles.Right}>接受</Text>
                            </View>
                        </View>
                    </ImageBackground>
                </View>
            )
        }
    }

    ClcickAction(num) {
        if (!this.state.hide) {
            this.hiden(),
                this.callback(num)
        }
    }

    hiden() {
        this.setState({title: "", cancleTitle: "", sureTitle: "", hiden: true})
    }

    show(title, cancleTitle, sureTitle, callback) {
        this.callback = callback
        if (this.state.hiden) {
            this.setState({title: title, cancleTitle: cancleTitle, sureTitle: sureTitle, hiden: false})
        }
    }
}

const styles = StyleSheet.create({
    BackView: {
        backgroundColor: '#343333',
        position: "absolute",
        width: height > width ? width : height,
        height: height > width ? height : width,
        left: left,
        top: top,
    },
    titleStyle: {
        fontSize: 17,
        marginTop: 30,
        color: "#fff",
        position: 'absolute',
        width: height > width ? width : height,
        height: height > width ? height : width,
        textAlign: 'center',
        ...Platform.select({
            ios: {
                lineHeight: 50,
            }
        })
    },
    Action: {
        justifyContent: 'center',
        alignSelf: 'center',
        flex: 1,
        alignItems: 'center',
        flexDirection: 'row',
        position: 'absolute',
        ...Platform.select({
            ios: {
                bottom: 30,
            },
            android: {
                bottom: 10,
            }
        }),
        // width: height > width ? width / 5 : width / 5,
        borderRadius: 8,
    },
    Right: {
        fontSize: 17,
        marginTop: 10,
        color: '#ffffff',
        textAlign: 'center',
        alignContent: 'center',
        ...Platform.select({
            ios: {
                lineHeight: 50,
            }
        })
    },

    Left: {
        fontSize: 17,
        marginTop: 10,
        color: '#ffffff',
        textAlign: 'center',
        alignContent: 'center',
        ...Platform.select({
            ios: {
                lineHeight: 50,
            }
        })
    }
})
const styles2 = StyleSheet.create({
    BackView: {
        backgroundColor: '#343333',
        position: "absolute",
        width: height > width ? height : width,
        height: height > width ? width : height,
        left: left,
        top: top,
    },
    titleStyle: {
        fontSize: 17,
        marginTop: 30,
        color: "#fff",
        position: 'absolute',
        width: height > width ? height : width,
        height: height > width ? width : height,
        textAlign: 'center',
        ...Platform.select({
            ios: {
                lineHeight: 50,
            }
        })
    },
    Action: {
        justifyContent: 'center',
        alignSelf: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        position: 'absolute',
        borderRadius: 8,
        ...Platform.select({
            ios: {
                bottom: 45,
            },
            android: {
                bottom: 10,
            }
        })
    },
    Right: {
        fontSize: 17,
        marginTop: 10,
        color: '#ffffff',
        textAlign: 'center',
        alignContent: 'center',
        ...Platform.select({
            ios: {
                lineHeight: 50,
            }
        })
    },

    Left: {
        fontSize: 17,
        marginTop: 10,
        color: '#ffffff',
        textAlign: 'center',
        alignContent: 'center',
        ...Platform.select({
            ios: {
                lineHeight: 50,
            }
        })
    }
})
