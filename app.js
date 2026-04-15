// app.js
App({
  onLaunch() {
    // 初始化云开发环境
    wx.cloud.init({
      env: 'cloudbase',
      traceUser: true
    })

    // 检查登录状态
    this.checkLoginStatus()
  },

  checkLoginStatus() {
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已授权，获取用户信息
          wx.getUserInfo({
            success: res => {
              this.globalData.userInfo = res.userInfo
              // 登录云函数获取openid
              this.login()
            }
          })
        }
      }
    })
  },

  login() {
    wx.cloud.callFunction({
      name: 'login',
      success: res => {
        this.globalData.openid = res.result.openid
        // 保存用户信息到数据库
        this.saveUserInfo()
      },
      fail: err => {
        console.error('登录失败', err)
      }
    })
  },

  saveUserInfo() {
    if (this.globalData.userInfo && this.globalData.openid) {
      const db = wx.cloud.database()
      db.collection('users').where({
        openid: this.globalData.openid
      }).get({
        success: res => {
          if (res.data.length === 0) {
            // 新用户，创建记录
            db.collection('users').add({
              data: {
                openid: this.globalData.openid,
                nickName: this.globalData.userInfo.nickName,
                avatarUrl: this.globalData.userInfo.avatarUrl,
                createdAt: new Date(),
                updatedAt: new Date()
              }
            })
          } else {
            // 老用户，更新信息
            db.collection('users').doc(res.data[0]._id).update({
              data: {
                nickName: this.globalData.userInfo.nickName,
                avatarUrl: this.globalData.userInfo.avatarUrl,
                updatedAt: new Date()
              }
            })
          }
        }
      })
    }
  },

  globalData: {
    userInfo: null,
    openid: null
  }
})
