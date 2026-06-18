let hostindex = 2,
  list_api_host = ['', ''],
  api_host = list_api_host[hostindex - 1]
config.gdHost = isHostOnGDSDK()
window.GMDEBUG = {}
window.GMDEBUG['LOADED SDK'] = Date.now()
window.GMSOFT_OPTIONS = config
window.GMSOFT_OPTIONS.enableAds = false
window.GMSOFT_OPTIONS.debug = false
window.GMSOFT_OPTIONS.pub_id = ''
window.GMSOFT_OPTIONS.unlockTimer = 60
window.GMSOFT_OPTIONS.timeShowInter = 60
window.GMSOFT_OPTIONS.domainHost = window.location.hostname
window.GMSOFT_OPTIONS.sourceHtml =''
window.GMSOFT_OPTIONS.sdkversion = 5
window.GMSOFT_OPTIONS.adsDebug = true
window.GMSOFT_OPTIONS.game = null
window.GMSOFT_OPTIONS.promotion = null
window.GMSOFT_OPTIONS.allow_play = 'yes'
let _gameId = window.GMSOFT_OPTIONS.gameId
function isDiffHost() {
  return true
}
var unityhostname = window.location.hostname
function httpGet(_0x190ce5) {
  var _0x9a1f74 = new XMLHttpRequest()
  return (
    _0x9a1f74.open('GET', _0x190ce5, false),
    _0x9a1f74.send(''),
    _0x9a1f74.responseText
  )
}
function isHostOnGDSDK() {
  let _0xce4a03 = window.location.hostname.split('.'),
    _0x8fa5c5 = _0xce4a03.slice(-2).join('.')
  return true
}
