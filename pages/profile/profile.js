// profile.js
const app = getApp()
const db = wx.cloud.database()

Page({
  data: {
    userInfo: {},
    openid: ''
  },

  onLoad() {
    this.setData({
      userInfo: app.globalData.userInfo || {},
      openid: app.globalData.openid || ''
    })
  },

  exportData() {
    wx.showLoading({ title: '导出中...' })
    
    db.collection('records').where({
      openid: app.globalData.openid
    }).get({
      success: res => {
        const records = res.data
        const dataStr = JSON.stringify(records, null, 2)
        const dataBlob = new Blob([dataStr], { type: 'application/json' })
        
        wx.downloadFile({
          url: URL.createObjectURL(dataBlob),
          success: res => {
            wx.saveFile({
              tempFilePath: res.tempFilePath,
              success: res => {
                wx.showToast({ title: '导出成功', icon: 'success' })
                wx.openDocument({
                  filePath: res.savedFilePath,
                  showMenu: true
                })
              },
              fail: err => {
                console.error('保存文件失败', err)
                wx.showToast({ title: '导出失败', icon: 'none' })
              }
            })
          },
          fail: err => {
            console.error('下载文件失败', err)
            wx.showToast({ title: '导出失败', icon: 'none' })
          }
        })
      },
      fail: err => {
        console.error('获取数据失败', err)
        wx.showToast({ title: '导出失败', icon: 'none' })
      },
      complete: () => {
        wx.hideLoading()
      }
    })
  },

  importData() {
    wx.chooseMessageFile({
      count: 1,
      type: 'file',
      success: res => {
        const tempFile = res.tempFiles[0]
        if (tempFile.name.endsWith('.json')) {
          wx.showLoading({ title: '导入中...' })
          
          wx.readFile({
            filePath: tempFile.path,
            success: res => {
              try {
                const records = JSON.parse(res.data)
                let successCount = 0
                
                records.forEach(record => {
                  record.openid = app.globalData.openid
                  record.createdAt = new Date(record.createdAt)
                  record.updatedAt = new Date(record.updatedAt)
                  
                  db.collection('records').add({
                    data: record,
                    success: () => {
                      successCount++
                      if (successCount === records.length) {
                        wx.hideLoading()
                        wx.showToast({ title: `成功导入 ${successCount} 条记录`, icon: 'success' })
                      }
                    },
                    fail: err => {
                      console.error('导入记录失败', err)
                      wx.hideLoading()
                      wx.showToast({ title: '导入失败', icon: 'none' })
                    }
                  })
                })
              } catch (e) {
                wx.hideLoading()
                wx.showToast({ title: '文件格式错误', icon: 'none' })
              }
            },
            fail: err => {
              console.error('读取文件失败', err)
              wx.hideLoading()
              wx.showToast({ title: '读取文件失败', icon: 'none' })
            }
          })
        } else {
          wx.showToast({ title: '请选择JSON文件', icon: 'none' })
        }
      }
    })
  },

  clearData() {
    wx.showModal({
      title: '警告',
      content: '确定要清空所有记账数据吗？此操作不可恢复',
      success: res => {
        if (res.confirm) {
          wx.showLoading({ title: '清空数据中...' })
          
          db.collection('records').where({
            openid: app.globalData.openid
          }).remove({
            success: res => {
              wx.hideLoading()
              wx.showToast({ title: `成功清空 ${res.stats.removed} 条记录`, icon: 'success' })
            },
            fail: err => {
              console.error('清空数据失败', err)
              wx.hideLoading()
              wx.showToast({ title: '清空数据失败', icon: 'none' })
            }
          })
        }
      }
    })
  },

  settings() {
    wx.showToast({ title: '功能开发中', icon: 'none' })
  },

  about() {
    wx.showModal({
      title: '关于记账本',
      content: '记账本 v1.0.0\n\n一个简单易用的微信记账小程序，帮助您记录日常收支，掌握个人财务状况。\n\n© 2026 记账本团队',
      showCancel: false
    })
  }
})