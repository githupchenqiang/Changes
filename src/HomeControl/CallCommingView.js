import React, {Component} from 'react'
import {Animated, Dimensions, Easing, Platform, StyleSheet, Text, TouchableOpacity, View} from 'react-native';

const {width, height} = Dimensions.get('window');
const [aWidth] = [width - 20];
const [left, top] = [0, 0];
const [middleLeft] = [(width - aWidth) / 2];

export default class componentName extends Component {
    constructor(props) {
        super(props);
        this.state = {
            offset: new Animated.Value(0),
            opacity: new Animated.Value(0),
            title: "",
            choose0: "",
            choose1: "",
            hide: true,
            tipTextColor: '#333333',
            aHeight: 350,
        };
        this.entityList = [];//数据源
        this.callback = function () {
        };//回调方法
    }

    render() {
        if (this.state.hide) {
            return (<View/>)
        } else {
            return (
                <View style={styles.container}>
                    <Animated.View style={styles.mask}>
                    </Animated.View>

                    <Animated.View style={[{
                        width: aWidth,
                        height: this.state.aHeight,
                        left: middleLeft,
                        ...Platform.select({
                            ios: {
                                bottom: -20,
                            },
                        }),
                        alignItems: "center",
                        justifyContent: "space-between",
                    }, {
                        transform: [{
                            translateY: this.state.offset.interpolate({
                                inputRange: [0, 1],
                                outputRange: [height, (height - this.state.aHeight - 34)]
                            }),
                        }]
                    }]}>
                        <View style={styles.content}>
                            {
                                this.entityList.map((item, i) => this.renderItem(item, i))
                            }

                            <View style={{height: 8, backgroundColor: '#DCDCDC', width: aWidth}}/>

                            <View style={styles.tipContentView2}>
                                <View style={{height: 0.5, backgroundColor: '#DCDCDC', width: aWidth}}/>
                                <TouchableOpacity
                                    onPress={() => {
                                        this.cancel()
                                    }}
                                >
                                    <View style={styles.item}>
                                        <Text style={{
                                            color: this.state.tipTextColor,
                                            fontSize: 17,
                                            textAlign: "center",
                                        }}>取消</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Animated.View>
                </View>
            );
        }
    }

    renderItem(item, i) {
        return (
            <View style={styles.tipContentView}>
                <View style={{height: 0.5, backgroundColor: '#DCDCDC', width: aWidth - 10, marginLeft: 5}}/>
                <TouchableOpacity
                    key={i}
                    onPress={this.choose.bind(this, i)}
                >
                    <View style={styles.item}>
                        <Text style={{
                            color: this.state.tipTextColor,
                            fontSize: 17,
                            textAlign: "center",
                        }}>{item}</Text>
                    </View>
                </TouchableOpacity>
            </View>
        );
    }

    componentWillUnmount() {
        // 如果存在this.timer，则使用clearTimeout清空。
        // 如果你使用多个timer，那么用多个变量，或者用个数组来保存引用，然后逐个clear
        this.timer && clearTimeout(this.timer);
        this.chooseTimer && clearTimeout(this.chooseTimer);
    }

    //显示动画
    in() {
        Animated.parallel([
            Animated.timing(
                this.state.opacity,
                {
                    easing: Easing.linear,//一个用于定义曲线的渐变函数
                    duration: 200,//动画持续的时间（单位是毫秒），默认为200。
                    toValue: 0.8,//动画的最终值
                }
            ),
            Animated.timing(
                this.state.offset,
                {
                    easing: Easing.linear,
                    duration: 200,
                    toValue: 1,
                }
            )
        ]).start();
    }

    //隐藏动画
    out() {
        Animated.parallel([
            Animated.timing(
                this.state.opacity,
                {
                    easing: Easing.linear,
                    duration: 200,
                    toValue: 0,
                }
            ),
            Animated.timing(
                this.state.offset,
                {
                    easing: Easing.linear,
                    duration: 200,
                    toValue: 0,
                }
            )
        ]).start((finished) => this.setState({hide: true}));
    }

    //取消
    cancel(event) {
        if (!this.state.hide) {
            this.setState({hide: true})
            this.out();
        }
    }

    //选择
    choose(i) {
        if (!this.state.hide) {
            this.setState({hide: true})
            this.out();
            this.chooseTimer = setTimeout(() => {
                this.callback(i);
            }, 200);
        }
    }

    /**
     * 弹出控件，最多支持3个选项(包括取消)
     * titile: 标题
     * entityList：选择项数据  数组
     * tipTextColor: 字体颜色
     * callback：回调方法
     */
    show(title, entityList, tipTextColor, callback) {
        this.entityList = entityList;
        this.callback = callback;

        if (this.state.hide) {
            if (entityList && entityList.length > 0) {
                let len = entityList.length;
                if (len === 1) {
                    this.setState({
                        title: title,
                        choose0: entityList[0],
                        hide: false,
                        tipTextColor: tipTextColor,
                        aHeight: 180
                    }, this.in);
                }
                if (len === 2) {
                    this.setState({
                        title: title,
                        choose0: entityList[0],
                        hide: false,
                        tipTextColor: tipTextColor,
                        aHeight: 180
                    }, this.in);
                }
                // else if (len === 3) {
                //   this.setState({title: title, choose0: entityList[0], hide: false, tipTextColor: tipTextColor, aHeight: 180}, this.in);
                // }
            }
        }
    }
}
const styles = StyleSheet.create({
    container: {
        position: "absolute",
        width: width,
        height: height,
        left: left,
        top: top,
    },
    mask: {
        justifyContent: "center",
        backgroundColor: "#000000",
        opacity: 0.3,
        position: "absolute",
        width: width,
        height: height,
        left: left,
        top: top,
    },
    // 分割线
    tipContentView: {
        borderRadius: 8,
        width: aWidth,
        height: 56,
        backgroundColor: '#fff',
    },
    tipContentView2: {
        borderRadius: 8,
        width: aWidth,
        height: 56,
        backgroundColor: '#fff',
    },
    item: {
        borderRadius: 8,
        width: aWidth,
        height: 56,
        backgroundColor: '#fff',
        justifyContent: 'center',
    },
    content: {
        borderWidth: 2,
        borderRadius: 8,
        backgroundColor: '#fff',
    }
});
