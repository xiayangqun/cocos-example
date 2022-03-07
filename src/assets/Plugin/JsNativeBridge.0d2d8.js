(function (root) {
  var exports = undefined,
      module = undefined,
      require = undefined;
  var define = undefined;
  (function () {
    let JsNativeBridge = {
      //获取android渠道的名字
      getAndroidChannel() {
        return jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsNativeBridge", "getAndroidChannel", "()Ljava/lang/String;");
      },

      openVivoForum() {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsNativeBridge", "openVivoForum", "()V");
      },

      exitGame() {
        jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsNativeBridge", "exitGame", "()V");
      },

      //存放了视频广告的东西
      _videoAds: {},

      createVideoAd(params) {
        if (cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.QQ_PLAY) {
          let video = this._videoAds[params.adUnitId];
          if (video) return video;
          video = wx.createRewardedVideoAd(params);
          video.onLoad(() => {
            console.log('激励视频 广告加载成功');
          });
          video.onError(res => {
            console.log('激励视频 广告加载失败', res);
          });
          video.onClose(res => {
            if (res && res.isEnded || res === undefined) {
              this.onAdComplete(true);
            } else {
              this.onAdComplete(false, LanguageConfig.get('wtfvtgr'));
            }
          });
          this._videoAds[params.adUnitId] = video;
          return video;
        } else if (cc.sys.platform == cc.sys.OPPO_GAME) {
          let video = this._videoAds[params.adUnitId];
          if (video) return video;
          video = qg.createRewardedVideoAd(params);
          video.load();
          video.onLoad(() => {
            console.log('激励视频 广告加载成功');
          });
          video.onError(res => {
            console.log('激励视频 广告加载失败', res);
          });
          video.onClose(res => {
            if (res && res.isEnded) {
              this.onAdComplete(true);
              video.load();
            } else {
              this.onAdComplete(false, LanguageConfig.get('wtfvtgr'));
            }
          });
          this._videoAds[params.adUnitId] = video;
          return video;
        } else if (cc.sys.platform == cc.sys.VIVO_GAME) {
          let video = this._videoAds[params.posId];
          if (video) return video;
          video = qg.createRewardedVideoAd(params);
          video.onClose(res => {
            if (res && res.isEnded) {
              this.onAdComplete(true);
              video.load();
            } else {
              this.onAdComplete(false, LanguageConfig.get('wtfvtgr'));
            }
          });
          this._videoAds[params.posId] = video;
          return video;
        } else if (cc.sys.platform == cc.sys.BYTE_GAME) {
          let video = this._videoAds[params.adUnitId];
          if (video) return video;

          if (tt && tt.createRewardedVideoAd) {
            video = tt.createRewardedVideoAd(params);
            video.onLoad(() => {
              console.log('激励视频 广告加载成功');
            });
            video.onError(res => {
              console.log('激励视频 广告加载失败', res);
            });
            video.onClose(res => {
              if (res && res.isEnded || res === undefined) {
                this.onAdComplete(true);
              } else {
                this.onAdComplete(false, LanguageConfig.get('wtfvtgr'));
              }
            });
            this._videoAds[params.adUnitId] = video;
            return video;
          } else {
            return null;
          }
        } else if (cc.sys.platform == cc.sys.MEIZU_GAME) {
          //创建激励视频广告组件，当前版本建议在使用广告的时候创建，关闭之后需要重新create
          return;
        } else if (cc.sys.platform == cc.sys.COCOS_PLAY) {
          let video = this._videoAds[params.videoId];
          if (video) return video;
          video = AdSDK.createRewardedVideoAd(params.adId, params.videoId, params.screenOrientation);
          video.onLoad(function () {
            console.log('视频广告加载成功');
          });
          video.onError(function (param) {
            console.log('视频广告加载失败', param);
            JsNativeBridge._videoAds[params.videoId] = null;
          });
          video.onClose(function () {
            console.log('视频关闭了');
            this._videoAds[Config.COCOSPLAYVideoAdID] && this._videoAds[Config.COCOSPLAYVideoAdID].destroy();
            this._videoAds[Config.COCOSPLAYVideoAdID] = null;
            this.createVideoAd({
              adId: Config.COCOSPLAYVideoAdID,
              videoId: Config.COCOSPLAYVideoAdID,
              screenOrientation: 2
            });
          }.bind(this));
          this._videoAds[params.videoId] = video;
        }
      },

      /*
        显示广告
        fun(result, message) => (false, '您必须完整的观看广告')
        parmas:{
          一些参数
        }
      */
      _adFun: null,
      _adTarget: null,

      showAd(fun, target, params) {
        this._adFun = fun;
        this._adTarget = target; //this._adFun && this._adFun.call(this._adTarget, false, '敬请期待');

        if (this.isInIPhoneOrIPad()) {
          jsb.reflection.callStaticMethod("JsNativeBridge", "showAd"); // this._adFun.call(this._adTarget, false, '敬请期待');
        } else if (this.isInAndroid()) {
          // jsb.reflection.callStaticMethod(
          //   "org/cocos2dx/javascript/JsNativeBridge",
          //   "showAd",
          //   "()V"
          // );
          this._adFun.call(this._adTarget, false, '暂无广告');
        } else if (cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.QQ_PLAY) {
          let rewardedVideoAd = this._videoAds[params.adUnitId];
          if (rewardedVideoAd == null) return console.log('视频广告不存在哎');
          let promise = rewardedVideoAd.show();
          promise && promise.catch(err => {
            rewardedVideoAd.load().then(() => rewardedVideoAd.show()).catch(() => {
              this.onAdComplete(false, LanguageConfig.get('ad_not_ready'));
            });
          });
        } else if (cc.sys.platform == cc.sys.OPPO_GAME) {
          let rewardedVideoAd = this._videoAds[params.adUnitId];
          if (rewardedVideoAd == null) return console.log('视频广告不存在哎');
          rewardedVideoAd.show().catch(err => {
            rewardedVideoAd.load().then(() => rewardedVideoAd.show()).catch(() => {
              this.onAdComplete(false, LanguageConfig.get('ad_not_ready'));
            });
          });
        } else if (cc.sys.platform == cc.sys.VIVO_GAME) {
          let rewardedVideoAd = this._videoAds[params.posId];
          if (rewardedVideoAd == null) return console.log('视频广告不存在哎');
          rewardedVideoAd.show().catch(err => {
            rewardedVideoAd.load().then(() => rewardedVideoAd.show()).catch(() => {
              this.onAdComplete(false, LanguageConfig.get('ad_not_ready'));
            });
          });
        } else if (cc.sys.platform == cc.sys.BYTE_GAME) {
          let rewardedVideoAd = this._videoAds[params.adUnitId];
          if (rewardedVideoAd == null) return console.log('视频广告不存在哎');
          rewardedVideoAd.show().catch(err => {
            rewardedVideoAd.load().then(() => rewardedVideoAd.show()).catch(() => {
              this.onAdComplete(false, LanguageConfig.get('ad_not_ready'));
            });
          });
        } else if (cc.sys.platform == cc.sys.MEIZU_GAME) {
          video = qg.createRewardedVideoAd(params);
          video.load && video.load();
          video.onLoad(() => {
            video.show();
          });
          video.onError(res => {
            console.log(res);
            this.onAdComplete(false, LanguageConfig.get('ad_not_ready'));
          });
          video.onRewarded(res => {
            this.onAdComplete(true);
          });
        } else if (cc.sys.platform == cc.sys.COCOS_PLAY) {
          let video = this._videoAds[params.adUnitId];

          if (video == null) {
            this.createVideoAd({
              adId: Config.COCOSPLAYVideoAdID,
              videoId: Config.COCOSPLAYVideoAdID,
              screenOrientation: 2
            });
            this.onAdComplete(false, LanguageConfig.get('ad_not_ready'));
          } else {
            video.show().then(function () {
              console.log('videoAd 广告显示成功，发放激励奖励');
              this.onAdComplete(true);
            }.bind(this), function (err) {
              console.log('videoAd 广告显示失败');
              this.onAdComplete(false, LanguageConfig.get('ad_not_ready'));
              this._videoAds[Config.COCOSPLAYVideoAdID] = null;
              this.createVideoAd({
                adId: Config.COCOSPLAYVideoAdID,
                videoId: Config.COCOSPLAYVideoAdID,
                screenOrientation: 2
              });
            }.bind(this));
          }
        } else {
          this.onAdComplete(true, '网页给你三倍吧');
        }
      },

      //native层会回调这个函数
      onAdComplete(result, message) {
        this._adFun && this._adFun.call(this._adTarget, result, message);
        this._adFun = null;
        this._adTarget = null;
        LocalData.cumulativeAdNum++;
      },

      track(name, params) {
        let jsonStr = JSON.stringify(params);

        if (this.isInIPhoneOrIPad()) {
          jsb.reflection.callStaticMethod("JsNativeBridge", "track:paramJson:", name, jsonStr);
        } else if (this.isInAndroid()) {} else {
          cc.log(name, jsonStr);
        }
      },

      //小震动
      smallShake() {
        if (this.isInIPhoneOrIPad()) {
          jsb.reflection.callStaticMethod("JsNativeBridge", "smallShake");
        } else if (this.isInAndroid()) {
          jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsNativeBridge", "smallShake", "()V");
        } else if (cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.QQ_PLAY) {
          wx.vibrateShort();
        } else if (cc.sys.platform == cc.sys.OPPO_GAME) {
          qg.vibrateShort();
        } else if (cc.sys.platform == cc.sys.VIVO_GAME) {
          qg.vibrateShort();
        } else if (cc.sys.platform == cc.sys.BYTE_GAME) {
          tt.vibrateShort({});
        } else {
          cc.log('下幅度震动');
        }
      },

      //中震动
      mediumShake() {
        if (this.isInIPhoneOrIPad()) {
          jsb.reflection.callStaticMethod("JsNativeBridge", "mediumShake");
        } else if (this.isInAndroid()) {
          jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsNativeBridge", "mediumShake", "()V");
        } else if (cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.QQ_PLAY) {
          wx.vibrateLong();
        } else if (cc.sys.platform == cc.sys.OPPO_GAME) {
          qg.vibrateLong();
        } else if (cc.sys.platform == cc.sys.VIVO_GAME) {
          qg.vibrateShort();
        } else if (cc.sys.platform == cc.sys.BYTE_GAME) {
          tt.vibrateLong({});
        } else {
          cc.log('中幅度震动');
        }
      },

      //
      heavyShake() {
        if (this.isInIPhoneOrIPad()) {
          jsb.reflection.callStaticMethod("JsNativeBridge", "heavyShake");
        } else if (this.isInAndroid()) {
          jsb.reflection.callStaticMethod("org/cocos2dx/javascript/JsNativeBridge", "heavyShake", "()V");
        } else {
          cc.log('大幅度震动');
        }
      },

      isInIPhoneOrIPad() {
        return cc.sys.platform == cc.sys.IPAD || cc.sys.platform == cc.sys.IPHONE;
      },

      isInAndroid() {
        return cc.sys.platform == cc.sys.ANDROID;
      },

      isWithoutJIT() {
        if (cc.sys.os !== cc.sys.OS_IOS) return false;
        if (cc.sys.isBrowser && cc.sys.browserType == cc.sys.BROWSER_TYPE_SAFARI) return false;
        return true;
      },

      //通过这种方式来播放的音频的话，是可以多轨道一起播放的
      playAudio(audioUrl) {
        if (LocalData.isMusicOn == false) return;

        if (cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.QQ_PLAY) {
          var audio = wx.createInnerAudioContext();
          audio.src = audioUrl; // src 可以设置 http(s) 的路径，本地文件路径或者代码包文件路径

          audio.play();
        } else if (cc.sys.platform == cc.sys.BYTE_GAME) {
          var audio = tt.createInnerAudioContext();
          audio.src = audioUrl; // src 可以设置 http(s) 的路径，本地文件路径或者代码包文件路径

          audio.play();
        }
      },

      _wxGunName2Indexs: {
        'desert_eagle': [18],
        'continuity_small': [0, 1, 2, 23],
        'continuity_weight': [3, 8, 9],
        'continuity_mediu': [4, 6, 11, 26],
        'spread_gun_0': [5, 12, 17, 19],
        'pistol': [7],
        'spread_gun_1': [10, 15, 20, 25, 28],
        'alien_0': [13, 21, 27],
        'green': [14],
        'silencing_gun': [16],
        'sniping': [22],
        'red': [24],
        'gatlin': [29]
      },

      getWXAudioNameByGunIndex(gunIndex) {
        let ret = null;

        for (let key in this._wxGunName2Indexs) {
          if (this._wxGunName2Indexs.hasOwnProperty(key)) {
            if (this._wxGunName2Indexs[key].includes(gunIndex)) {
              ret = key;
            }
          }
        }

        return 'audio/' + ret + '.mp3';
      },

      _shareCb: null,
      _shareStartTime: 0,

      //发起share的时间

      /*
        {
          title:
          imageUrl,
          cb
        }
        cb(result:boolean, msg:'错误原因');
      */
      showShare(params) {
        let title = params.title;
        let imageUrl = params.imageUrl;
        let cb = params.cb;

        if (cc.sys.platform == cc.sys.WECHAT_GAME) {
          wx.aldShareAppMessage({
            title: title,
            imageUrl: imageUrl
          });
          this._shareCb = cb;
          LocalData.shareTimes++;
          this._shareStartTime = moment().unix();
          NotificationCenter.addObserver(NCKeys.EVENT_SHOW, this._onGameShow, this);
        } else if (cc.sys.platform == cc.sys.QQ_PLAY) {
          qq.shareAppMessage({
            title: title,
            imageUrl: imageUrl
          });
          this._shareCb = cb;
          LocalData.shareTimes++;
          this._shareStartTime = moment().unix();
          NotificationCenter.addObserver(NCKeys.EVENT_SHOW, this._onGameShow, this);
        } else if (cc.sys.platform == cc.sys.BYTE_GAME) {
          tt.shareAppMessage({
            title: title,
            imageUrl: imageUrl
          });
        } else {
          cb && cb(false, '没有这个功能哦');
        }
      },

      //当游戏返回前台了
      _onGameShow() {
        NotificationCenter.removeObserver(NCKeys.EVENT_SHOW, this);
        if (this._shareCb == null) return;

        if (LocalData.shareTimes == 1) {
          this._shareCb(false, '分享失败，请重试');
        } else if (LocalData.shareTimes == 3) {
          this._shareCb(false, '请分享到不同的人或群组');
        } else {
          let offsetTime = moment().unix() - this._shareStartTime;

          if (offsetTime < 4) {
            this._shareCb(false, '分享失败，请分享到不同的人或群组');
          } else {
            this._shareCb(true);
          }
        }

        this._shareCb = null;
      },

      //用于储存bannerad的一个东西
      _bannerAds: {},

      /*
      如果是微信的话
        params:{
          adUnitId,
          adIntervals,
          style,
        }
      */
      createBannerAd(params) {
        if (cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.QQ_PLAY) {
          if (this._bannerAds[params.adUnitId]) return this._bannerAds[params.adUnitId];
          let bannerAd = wx.createBannerAd(params);
          bannerAd.onError(res => {
            console.log('banner加载失败', res);
          });
          bannerAd.onLoad(res => {
            console.log('banner加载成功', res);
          });
          bannerAd.onResize(size => {
            console.log('bannerResize');
            const {
              windowWidth,
              windowHeight
            } = wx.getSystemInfoSync();

            if (Math.abs(bannerAd.style.left - (windowWidth - size.width) / 2) > 5) {
              bannerAd.style.left = (windowWidth - size.width) / 2;
              bannerAd.style.top = windowHeight - size.height;
            }
          });
          this._bannerAds[params.adUnitId] = bannerAd;
          return bannerAd;
        } else if (cc.sys.platform == cc.sys.OPPO_GAME) {
          let bannerAd = qg.createBannerAd(params);
          this._bannerAds[params.adUnitId] = bannerAd;
          return bannerAd;
        } else if (cc.sys.platform == cc.sys.VIVO_GAME) {
          //vivo  banner广告实例不能复用，每次需要重新加载时要重新create.所以在这里不用创建
          cc.log('vivo  banner广告实例不能复用，每次需要重新加载时要重新create.所以在这里不用创建');
        } else if (cc.sys.platform == cc.sys.BYTE_GAME) {
          if (this._bannerAds[params.adUnitId]) return this._bannerAds[params.adUnitId];

          if (tt && tt.createBannerAd) {
            let bannerAd = tt.createBannerAd(params);
            bannerAd.onError(res => {
              console.log('banner加载失败', res);
            });
            bannerAd.onLoad(res => {
              console.log('banner加载成功', res);
            });
            bannerAd.onResize(size => {
              console.log('bannerResize');
              const {
                windowWidth,
                windowHeight
              } = tt.getSystemInfoSync();

              if (Math.abs(bannerAd.style.left - (windowWidth - size.width) / 2) > 5) {
                bannerAd.style.left = (windowWidth - size.width) / 2;
                bannerAd.style.top = windowHeight - size.height;
              }
            });
            this._bannerAds[params.adUnitId] = bannerAd;
            return bannerAd;
          } else {
            cc.log('当前tt没有banner哦');
            return null;
          }
        } else if (cc.sys.platform == cc.sys.MEIZU_GAME) {
          if (this._bannerAds[params.adUnitId]) return this._bannerAds[params.adUnitId];
          let bannerAd = qg.createBannerAd(params);
          bannerAd.hide();
          bannerAd.onClose(() => {
            console.log("banner 广告关闭");
            this._bannerAds[params.adUnitId] = null;
          });
          bannerAd.onResize(size => {
            console.log('bannerResize');
            const {
              windowWidth,
              windowHeight
            } = qg.getSystemInfoSync();

            if (Math.abs(bannerAd.style.left - (windowWidth - size.width) / 2) > 5) {
              bannerAd.style.left = (windowWidth - size.width) / 2;
              bannerAd.style.top = windowHeight - size.height;
            }
          });
          this._bannerAds[params.adUnitId] = bannerAd;
          return bannerAd;
        } else if (cc.sys.platform == cc.sys.COCOS_PLAY) {
          if (this._bannerAds[params.bannerId]) return this._bannerAds[params.bannerId];
          let bannerAd = AdSDK.createBannerAd(params.adId, params.bannerId, params.position);
          bannerAd.onLoad(function () {
            console.log('banner加载成功');
          });
          bannerAd.onError(function () {
            console.log('banner加载失败, 清除保留的banner');
            this._bannerAds[params.bannerId] = null;
          }.bind(this));
          this._bannerAds[params.bannerId] = bannerAd;
          return bannerAd;
        }
      },

      showBannerAd(adUnitId) {
        if (this.isInIPhoneOrIPad()) {
          jsb.reflection.callStaticMethod("JsNativeBridge", "showBanner");
          return false;
        } else if (cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.QQ_PLAY) {
          let bannerAd = this._bannerAds[adUnitId];

          if (bannerAd == null) {
            cc.log('banner 不存在');
            return false;
          } else {
            bannerAd.show();
            return true;
          }
        } else if (cc.sys.platform == cc.sys.OPPO_GAME) {
          let bannerAd = this._bannerAds[adUnitId];

          if (bannerAd == null) {
            return cc.log('banner 不存在');
          } else {
            bannerAd.show();
          }
        } else if (cc.sys.platform == cc.sys.VIVO_GAME) {
          //vivo的banner广告不能复用，每次显示需要重新Create
          let style = Utils.convertToVIVOStyle(320, 100, 640, 200);
          let banner = qg.createBannerAd({
            style: {},
            posId: adUnitId
          });
          banner.onLoad(() => {
            banner.show().then(() => {
              console.log('Banner展示成功');
            }).catch(err => {
              console.log(err);
            });
          });
          banner.onError(res => {
            console.log(res);
          });
          banner.onClose(() => {
            LocalData.todayCloseBannerTimes++;
          });
          this._bannerAds[adUnitId] = banner;
          return banner;
        } else if (cc.sys.platform == cc.sys.BYTE_GAME) {
          let bannerAd = this._bannerAds[adUnitId];

          if (bannerAd == null) {
            cc.log('banner 不存在');
            return false;
          } else {
            bannerAd.show();
            return true;
          }
        } else if (cc.sys.platform == cc.sys.MEIZU_GAME) {
          let bannerAd = this._bannerAds[adUnitId];

          if (bannerAd == null) {
            this.createBannerAd({
              adUnitId: Config.MEIZUBannerAdID,
              style: Utils.convertToOppoStyle(320, 100, 640, 200)
            });
            return false;
          } else {
            bannerAd.show();
            return true;
          }
        } else if (cc.sys.platform == cc.sys.COCOS_PLAY) {
          let bannerAd = this._bannerAds[adUnitId];

          if (bannerAd == null) {
            this.createBannerAd({
              adId: Config.COCOSPLAYBannerAdID,
              bannerId: Config.COCOSPLAYBannerAdID,
              position: 2
            });
            return false;
          }

          ;
          bannerAd.show();
          return true;
        }
      },

      hideBannerAd(adUnitId) {
        if (this.isInIPhoneOrIPad()) {
          jsb.reflection.callStaticMethod("JsNativeBridge", "hideBanner");
        } else if (cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.QQ_PLAY) {
          let bannerAd = this._bannerAds[adUnitId];

          if (bannerAd == null) {
            return cc.log('banner 不存在');
          } else {
            bannerAd.hide();
          }
        } else if (cc.sys.platform == cc.sys.OPPO_GAME) {
          let bannerAd = this._bannerAds[adUnitId];

          if (bannerAd == null) {
            return cc.log('banner 不存在');
          } else {
            bannerAd.hide();
          }
        } else if (cc.sys.platform == cc.sys.VIVO_GAME) {
          let bannerAd = this._bannerAds[adUnitId];

          if (bannerAd == null) {
            return cc.log('banner 不存在');
          } else {
            bannerAd.hide();
            bannerAd.destroy();
            console.log('banner被销毁了');
          }
        } else if (cc.sys.platform == cc.sys.BYTE_GAME) {
          let bannerAd = this._bannerAds[adUnitId];

          if (bannerAd == null) {
            return cc.log('banner 不存在');
          } else {
            bannerAd.hide();
          }
        } else if (cc.sys.platform == cc.sys.MEIZU_GAME) {
          let bannerAd = this._bannerAds[adUnitId];

          if (bannerAd == null) {
            return cc.log('banner 不存在');
          } else {
            bannerAd.hide();
          }
        } else if (cc.sys.platform == cc.sys.COCOS_PLAY) {
          let bannerAd = this._bannerAds[adUnitId];
          if (bannerAd) bannerAd.hide();
        }
      },

      //oppo家的独有东西 begin
      oppoInited: false,
      oppoNativeAd: null,
      oppoNativeAdInfoAdList: null,
      nativeIds: [],

      initOppoNativeAdOrBannerID() {
        if (this.oppoNativeAd && this.oppoNativeAdInfoAdList) return;
        this.nativeIds = [Config.OPPONativeAdID3, Config.OPPONativeAdID2, Config.OPPONativeAdID1];

        this._initOppoNativeAdOrBannerID();
      },

      _initOppoNativeAdOrBannerID() {
        let natvieId = this.nativeIds.pop();

        if (natvieId == null) {
          this.oppoNativeAd = null;
          this.oppoNativeAdInfoAdList = null;
          let style = Utils.convertToWXStyle(320, 100, 640, 200);
          JsNativeBridge.createBannerAd({
            adUnitId: Config.OPPOBannerAdID,
            style: style
          });
        } else {
          this.oppoNativeAd = qg.createNativeAd({
            adUnitId: natvieId
          });
          this.oppoNativeAd.load();
          this.oppoNativeAd.onError(() => {
            cc.log('加载原生广告失败,剩余次数：', this.nativeIds.length);
            this.oppoNativeAd = null;

            this._initOppoNativeAdOrBannerID();
          });
          this.oppoNativeAd.onLoad(res => {
            this.oppoNativeAdInfoAdList = res.adList;
            cc.log('加载原生的广告成功了', res.adList);
          });
        }
      },

      tryShowOppoNativeBanner(parentNode) {
        if (moment().unix() - TempData.enterGameTimeStamp < 60) {
          console.log('进入游戏前60s不能显示原生和banner广告');
          return false;
        }

        if (Config.remoteConfig.oppoBannerWithNoLimits == false && LocalData.todayCloseBannerTimes >= 5) {
          console.log('oppo的banner广告不是无视次数限制的,今日关闭次数达到了五次,不能再展示了');
          return false;
        }

        if (this.oppoNativeAd == null || this.oppoNativeAdInfoAdList == null) {
          console.log('没有加载到oppo的native广告,再次尝试一下');
          this.initOppoNativeAdOrBannerID();
          return false;
        }

        cc.loader.loadRes('prefabs/oppoNativeAdBanner/oppoNativeAdBanner', cc.Prefab, (err, prefab) => {
          if (err) return console.log(err);

          if (cc.isValid(parentNode)) {
            let oppoNativeBannerNode = cc.instantiate(prefab);
            oppoNativeBannerNode.parent = parentNode;
          }
        });
        return true;
      },

      //尝试显示插屏广告，
      tryShowOppoInterstitialAd() {
        return false;

        if (moment().unix() - this._showInterstitialAdTimeStamp >= 60 && Math.random() < Config.remoteConfig.interstitialAdRate) {
          this.showInterstitialAd(Config.OPPOInterstitialAdID);
          return true;
        } else {
          return false;
        }
      },

      //oppo独有的东西结束
      //vivo独有的东西开始
      vivoInited: false,
      vivoNativeAd: null,
      vivoNativeAdInfoAdList: null,

      initVivoNativeAd() {
        if (this.vivoNativeAd && this.vivoNativeAdInfoAdList) return;
        let nativeAd = qg.createNativeAd({
          posId: Config.VIVONativeAdID
        });
        nativeAd.load();
        nativeAd.onLoad(res => {
          this.vivoNativeAd = nativeAd;
          this.vivoNativeAdInfoAdList = res.adList;
        });
      },

      //尝试显示vivo的 native做成的插屏
      tryShowVivoInterstitialAd(parentNode) {
        if (this.vivoNativeAd == null || this.vivoNativeAdInfoAdList == null) {
          console.log('vivo插屏数据不存在,尝试重新加载');
          this.initVivoNativeAd();
          return false;
        }

        if (Math.random() < Config.remoteConfig.interstitialAdRate && this.vivoNativeAd && this.vivoNativeAdInfoAdList) {
          cc.loader.loadRes('prefabs/vivoNativeAdInterstitial/vivoNativeAdInterstitial', cc.Prefab, (err, prefab) => {
            if (cc.isValid(parentNode) == false) return;
            if (err) return console.log(err);
            let node = cc.instantiate(prefab);
            node.parent = parentNode;
            this._showInterstitialAdTimeStamp = moment().unix();
          });
          return true;
        } else {
          return false;
        }
      },

      tryShowVivoBanner() {
        if (Config.remoteConfig.vivoAdStrategy == 1 && LocalData.todayCloseBannerTimes >= 5) {
          return false;
        } else {
          this.showBannerAd(Config.VIVOBannerAdID);
          return true;
        }
      },

      //vivo独有的东西结束
      //字节跳动独有的东西开始
      tryShowByteBanner() {
        if (Config.remoteConfig.byteAdStrategy == 1 && LocalData.todayCloseBannerTimes >= 5) {
          return false;
        } else {
          return this.showBannerAd(Config.BYTEBannerAdID);
        }
      },

      tryShowByteInterstitialAd() {
        if (moment().unix() - this._showInterstitialAdTimeStamp >= 60 && Math.random() < Config.remoteConfig.interstitialAdRate) {
          return this.showInterstitialAd(Config.BYTEInterstitialAdID);
        } else {
          return false;
        }
      },

      //字节跳动独有的东西结束了
      //QQ独有的东西开始
      tryShowQQBanner() {
        if (Config.remoteConfig.qqAdStrategy == 1 && LocalData.todayCloseBannerTimes >= 5) {
          return false;
        } else {
          return this.showBannerAd(Config.QQBannerAdID);
        }
      },

      tryShowQQInterstitialAd() {
        if (moment().unix() - this._showInterstitialAdTimeStamp >= 60 && Math.random() < Config.remoteConfig.interstitialAdRate) {
          return this.showInterstitialAd(Config.QQInterstitialAdID);
        } else {
          return false;
        }
      },

      //QQ独有的东西结束
      //魅族独有的东西开始
      tryShowMEIZUInterstitialAd() {
        if (moment().unix() - this._showInterstitialAdTimeStamp >= 60 && Math.random() < Config.remoteConfig.interstitialAdRate) {
          return this.showInterstitialAd(Config.MEIZUInterstitialAdID);
        } else {
          return false;
        }
      },

      //魅族独有的东西结束
      //
      _interstitialAds: {},

      createInterstitialAd(params) {
        if (cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.QQ_PLAY) {
          let ad = this._interstitialAds[params.adUnitId];
          if (ad) return ad;
          ad = wx.createInterstitialAd(params);
          ad.onLoad(() => {
            console.log('插屏广告创建成功');
          });
          ad.onError(res => {
            console.log('插屏广告创建失败', res);
          });
          this._interstitialAds[params.adUnitId] = ad;
          return ad;
        } else if (cc.sys.platform == cc.sys.OPPO_GAME) {
          return; //oppo不许有插屏广告了

          let ad = this._interstitialAds[params.adUnitId];
          if (ad) return ad;
          ad = qg.createInterstitialAd(params);
          ad.load();
          ad.onLoad(() => {
            console.log('插屏广告创建成功');
          });
          ad.onError(res => {
            console.log('插屏广告创建失败', res);
          });
          this._interstitialAds[params.adUnitId] = ad;
          return ad;
        } else if (cc.sys.platform == cc.sys.BYTE_GAME) {
          // let ad = this._interstitialAds[params.adUnitId];
          // if (ad) return ad;
          // if (tt && tt.createInterstitialAd) {
          //   ad = tt.createInterstitialAd(params);
          //   ad.onLoad(() => { console.log('插屏广告创建成功') });
          //   ad.onError((res) => { console.log('插屏广告创建失败', res) });
          //   ad.onClose(() => { ad.load(); });
          //   ad.load();
          //   this._interstitialAds[params.adUnitId] = ad;
          //   return ad;
          // }
          // else {
          //   //tt没有插屏广告哦
          //   return null;
          // }
          return null;
        } else if (cc.sys.platform == cc.sys.MEIZU_GAME) {
          let ad = this._interstitialAds[params.adUnitId];
          if (ad) return ad;
          ad = qg.createInterstitialAd(params);
          ad.load && ad.load();
          ad.onLoad(() => {
            console.log('插屏广告创建成功');
          });
          ad.onError(res => {
            console.log('插屏广告创建失败', res);
          });
          this._interstitialAds[params.adUnitId] = ad;
          return ad;
        } else if (cc.sys.platform == cc.sys.COCOS_PLAY) {//插屏创建一次。展示一次
          // let ad = this._interstitialAds[params.interstitialId];
          // if (ad) return ad;
          // ad = AdSDK.createInterstitialAd(params.adId, params.interstitialId, params.style)
          // ad.onLoad(function () {
          //   console.log('插屏加载成功');
          // });
          // ad.onError(function () {
          //   console.log('插屏加载失败，清除插屏');
          //   this._interstitialAds[params.interstitialId] = null;
          // }.bind(this));
          // ad.onClose
          // this._interstitialAds[params.interstitialId] = ad;
          // return ad;
        }
      },

      //最近一次显示插屏广告的时间戳：秒
      _showInterstitialAdTimeStamp: 0,

      showInterstitialAd(adUnitId) {
        this._showInterstitialAdTimeStamp = moment().unix();

        if (this.isInIPhoneOrIPad()) {
          jsb.reflection.callStaticMethod("JsNativeBridge", "showInterstitial");
        } else if (cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.QQ_PLAY) {
          let ad = this._interstitialAds[adUnitId];
          if (ad == null) return console.log('没有找到插屏广告');
          ad.show().catch(() => {});
        } else if (cc.sys.platform == cc.sys.OPPO_GAME) {
          return; //oppo不许有插屏广告了

          let ad = this._interstitialAds[adUnitId];
          if (ad == null) return console.log('没有找到插屏广告');
          ad.show();
        } else if (cc.sys.platform == cc.sys.BYTE_GAME) {
          //字节的插屏不能预先保存
          if (tt && tt.createInterstitialAd) {
            ad = tt.createInterstitialAd({
              adUnitId: adUnitId
            });
            ad.onLoad(() => {
              console.log('插屏广告创建成功');
            });
            ad.onError(res => {
              console.log('插屏广告创建失败', res);
            });
            ad.load().then(() => {
              ad.show();
            });
            return ad;
          } else {
            //tt没有插屏广告哦
            return null;
          }
        } else if (cc.sys.platform == cc.sys.MEIZU_GAME) {
          let ad = this._interstitialAds[adUnitId];
          if (ad == null) return false;
          ad.show();
        } else if (cc.sys.platform == cc.sys.COCOS_PLAY) {
          var interstitialAd = AdSDK.createInterstitialAd(adUnitId, adUnitId, 2);
          interstitialAd.onLoad(function () {
            interstitialAd.show();
          });
        }
      },

      //在真机上是否在屏幕顶端有菜单按钮，比如微信小游戏的顶端就有
      isNativeToolBarInTop() {
        return cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.OPPO_GAME || cc.sys.platform == cc.sys.VIVO_GAME || cc.sys.platform == cc.sys.BYTE_GAME || cc.sys.platform == cc.sys.QQ_PLAY || cc.sys.platform == cc.sys.MEIZU_GAME;
      },

      //当前平台是否具有分享的功能
      isPlatformHaveShareFunction() {
        return cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.QQ_PLAY;
      },

      canUseAld() {
        return cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.QQ_PLAY;
      },

      canUseCocosAnalytics() {
        return cc.sys.platform !== cc.sys.WECHAT_GAME && cc.sys.platform !== cc.sys.QQ_PLAY && this.isInIPhoneOrIPad() !== false && this.isInAndroid() !== false // && cc.sys.platform !== cc.sys.DESKTOP_BROWSER
        ;
      },

      //是否是红包版本
      isRedBegVersion() {
        // return true;
        return cc.sys.platform == cc.sys.QQ_PLAY;
      },

      //是否使用了nativeapi来播放音效
      isUseNativeAudioApi() {
        return cc.sys.platform == cc.sys.WECHAT_GAME || cc.sys.platform == cc.sys.QQ_PLAY || cc.sys.platform == cc.sys.MEIZU_GAME || cc.sys.platform == cc.sys.BYTE_GAME;
      }

    };
    window.JsNativeBridge = JsNativeBridge;
  }).call(root);
})( // The environment-specific global.
function () {
  if (typeof globalThis !== 'undefined') return globalThis;
  if (typeof self !== 'undefined') return self;
  if (typeof window !== 'undefined') return window;
  if (typeof global !== 'undefined') return global;
  if (typeof this !== 'undefined') return this;
  return {};
}.call(this));