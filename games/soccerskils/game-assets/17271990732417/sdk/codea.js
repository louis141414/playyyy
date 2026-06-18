var bienfunction;
var bienfunctionIN;
var idgamedumv = '1303';
var intern_so_phut_dumv = 1;
window.alert = function () { };
window.open = function () { };
var methods = ["log", "debug", "warn", "info", "error"];
for (var i = 0; i < methods.length; i++) {
    console[methods[i]] = function () { };
}
//dumv
libUrl = '/js-html5/8/1303?version=2';
if (libUrl.length > 5) {
    var adsdumv = document.createElement("script");
    adsdumv.setAttribute("src", libUrl),
        adsdumv.setAttribute("type", "text/javascript"),
        adsdumv.setAttribute("crossOrigin", "anonymous"),
        adsdumv.onload = function () {
            (_antgamesSDK.Init = window._antgamesSDK.Init || []).push(function () {
                AntGamesSDK.PreLoadInterstitialAd();
            });

            bienfunction = function (e) {
                var flagRewarded = false;
                (_antgamesSDK.Init = window._antgamesSDK.Init || []).push(async function () {
                    AntGamesSDK.ShowRewardedAd(_antgamesSDK.tagAutoReward, {
                        // các callback của quảng cáo rewarded
                        onRewarded: () => {
                            // đủ điều kiện nhận thưởng
                            flagRewarded = true;
                        },
                        onClose: () => { // đóng quảng cáo rewarded
                            e(flagRewarded);
                        },
                        onAdReady: () => {
                            // quảng cáo sẵn sàng - khi dùng
                        },
                        onAdEmpty: () => {
                            // không có quảng cáo
                            // có thể tiếp tục hành động chơi game tiếp ở đây
                            e(false);

                        }
                    });
                })
            }

            bienfunctionIN = function (e) {
                (_antgamesSDK.Init = window._antgamesSDK.Init || []).push(function () {
                    AntGamesSDK.ShowInterstitialAd('04DA-16EE-1ED6-1B98', {
                        onAdClose: () => {
                            // đóng quảng cáo intersitital
                            e();
                        },
                        onBeforeAdImpression: () => {
                            // trước khi quảng cáo bắt đầu hiển thị

                        },
                        onAdImpression: () => {
                            // quảng cáo hiển thị thành công

                        },
                        onAdInterstitialEmpty: () => {
                            // không có quảng cáo
                            // có thể tiếp tục hành động chơi game tiếp ở đây
                            e();
                        }
                    });
                });

            }
        },
        document.head.appendChild(adsdumv);
} else {
    bienfunction = function (e) {
        e(true)
    }
    bienfunctionIN = function (e) {
        e()
    }
}