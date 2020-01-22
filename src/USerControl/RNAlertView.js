import React, {Component} from 'react';
import {Modal, StyleSheet, Text, TextInput, TouchableOpacity, View,} from 'react-native';
import {storage} from '../storageUtil'

export default class RNAlertView extends Component {

    //定义静态的属性,可通过传参数的方式直接传送,那在本组件中就需要使用this.props.alertTitle等写法
    // static propTypes = {
    //       //自定义取消确定文本
    // }

    constructor(props) {
        super(props);
        alertTitle=  "文本标题",  //自定义文本标题
        alertContent= "文本内容",  //自定义文本内容
        cancleBtnTitle= "取消",  //自定义取消按钮文本
        comformBtnTitle= "确定",
        this.state = ({
            isShow: false,
            gpsIP: '',
        })
    }

    componentDidMount() {
        storage.load("gpsAddress", (ip) => {
            if (ip.length > 0) {
                this.state.gpsIP = ip
            }
        })
    }

    render() {
        if (!this.state.isShow) {
            return null;
        } else {
            return (
                <Modal
                    visible={this.state.isShow}
                    //显示是的动画默认none
                    //从下面向上滑动slide
                    //慢慢显示fade
                    animationType={'fade'}
                    //是否透明默认是不透明 false
                    transparent={true}
                    //关闭时调用
                    onRequestClose={() => {
                    }}
                >
                    <View style={styles.container}>
                        <View style={styles.AlertView}>
                            <View style={{justifyContent: 'center', alignItems: 'center', height: 30}}><Text
                                style={{
                                    fontSize: 15,
                                    fontWeight: '300',
                                    marginTop: 20,
                                    color: '#000000'
                                }}>{this.props.alertTitle}</Text></View>
                            <View style={{justifyContent: 'center', alignItems: 'center', height: 30}}><Text
                                style={{fontSize: 16, color: 'grey'}}>{this.props.alertContent}</Text></View>
                            <TextInput
                                placeholder=' 在此输入接口地址'
                                placeholderTextColor='#CDCDCD'
                                underlineColorAndroid='#006978'
                                onChangeText={(text) => {
                                    this.setState({
                                        gpsIP: text
                                    })
                                }}
                                style={{marginLeft: 20, marginRight: 20, size: 12}}
                            >{this.state.gpsIP}</TextInput>
                            <View style={{height: 1, backgroundColor: 'lightgrey', marginTop: 20}}></View>


                            <View style={{flexDirection: 'row', height: 50}}>
                                <TouchableOpacity onPress={() => {
                                    this.saveGpsIp();
                                    this.dissmiss(0.05);
                                }} style={{flex: 0.49, justifyContent: 'center', alignItems: 'center'}}>
                                    <Text style={{fontSize: 13, color: 'red'}}>确定</Text>
                                </TouchableOpacity>

                                <View style={{height: 50, backgroundColor: 'lightgrey', width: 1}}></View>

                                <TouchableOpacity onPress={() => {
                                    this.dissmiss(0.05);
                                }} style={{flex: 0.49, justifyContent: 'center', alignItems: 'center'}}>
                                    <Text style={{fontSize: 13, color: 'blue'}}>取消</Text>
                                </TouchableOpacity>

                            </View>
                        </View>
                    </View>
                </Modal>
            )
        }
        ;


    }

    saveGpsIp() {
        storage.save("gpsAddress", this.state.gpsIP)
    }


    //显示
    show(title, content) {
        this.setState({
            isShow: true,  //显示弹窗
            alertTitle: title,
            alertContent: content,
        })
    }

    //消失弹窗
    dissmiss = (delay) => {
        // 延时0.5,据说体验比较好
        let duration = 0;

        if (delay == null || delay <= 0) {
            duration = 3;
        } else {
            duration = delay;
        }

        this.timer = setTimeout(() => {
            this.setState({
                isShow: false,
            });
            this.timer && clearTimeout(this.timer);
        }, duration * 1000);
    }

}

const styles = StyleSheet.create({

    container: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.1)',
    },

    AlertView: {
        backgroundColor: 'white',
        borderRadius: 10,
        borderWidth: 1,
        height: 180,
        marginLeft: 20,
        marginRight: 20,
        borderColor: 'lightgrey',
    }
})
