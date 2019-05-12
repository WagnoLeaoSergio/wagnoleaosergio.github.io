var inputDeviceGuid = "";
var webSocketsInputDeviceServer = "";

function InitializeInputDevice() {
    inputDeviceGuid = getInputDeviceGuid();
    webSocketsInputDeviceServer = getWebSocketsInputDeviceServer();
}

InitializeInputDevice();
if (!("WebSocket" in window)) {
	// Browser doesn't support websockets
    alert("Browser doesn't support websockets");
else {
	// Browser supports websockets
    InitializeWebSocketsInputDevice();
}

function InitializeWebSocketsInputDevice() {

    try {
	
        host = webSocketsInputDeviceServer;

        websocket = new WebSocket(host);
        websocket.onopen = function(evt) {
            onOpen(evt);
        };
        websocket.onclose = function(evt) {
            onClose(evt);
        };
        websocket.onmessage = function(evt) {
            onMessage(evt);
        };
        websocket.onerror = function(evt) {
            onError(evt);
        };
    } catch (exception) {
    }
}

function onOpen(evt) {
    websocket.send('SessionID=' + inputDeviceGuid);
    websocket.send('ReceiveCompressedData=0');

    ConfigCacFrameworkSource('RGBVideo', false);
    onCacFrameworkConnect('connected');
}

function onClose(evt) {
    writeToScreen("DISCONNECTED");
    onCacFrameworkConnect('closed');
}

function onMessage(evt) {

    try
    {
        var F = jQuery.parseJSON(evt.data);
        if (typeof F.ContainerCompression !== 'undefined')
        {
            var uncompressed = LZString.decompressFromUTF16(F.CompressedData);
            F = jQuery.parseJSON(uncompressed);
        }
        if (F.Device.DeviceType === 1) {
            window.KinectSource = F;
            onSkeletonEvent(F);
        }
        else if ((F.Device.DeviceType === 2) || (F.Device.DeviceType === 3)) {
            window.WiiSource = F;
            onWiiEvent(F);
        }
        else if (F.Device.DeviceType === 4) {
            window.MindwaveSource = F;
            onMindwaveEvent(F);
        }
        else if (F.Device.DeviceType === 5) {
            window.RGBVideoSource = F;
            onRGBVideoEvent(F);
        }
        else if (F.Device.DeviceType === 7) {
            window.AndroidSensorSource = F;
            onAndroidSensorEvent(F);
        }
    }
    catch (e)
    {
    }
}

function onError(evt) {
    writeToScreen('<span style="color: red;">ERROR:</span> ' + evt.data);
}

function doSend(message) {
    writeToScreen("SENT: " + message);
    websocket.send(message);
}

function writeToScreen(message) {
    var pre = document.createElement("p");
    pre.style.wordWrap = "break-word";
    pre.innerHTML = message;
}

function ConfigCacFrameworkSource(deviceType, enable) {
    var deviceTypeInt;

    switch (deviceType) {
        case 'Skeleton':
            deviceTypeInt = 1;
            break;
        case 'Wiimote':
            deviceTypeInt = 2;
            break;
        case 'WiiBalanceboard':
            deviceTypeInt = 3;
            break;
        case 'Mindwave':
            deviceTypeInt = 4;
            break;
        case 'RGBVideo':
            deviceTypeInt = 5;
            break;
        case 'AndroidSensor':
            deviceTypeInt = 7;
            break;
        default:
            return;
    }

    var deviceException = 2;
    if (enable === false) {
        deviceException = 1;
    }
	
	websocket.send('{"ID":0,"DeviceID":"","PublicIP":null,"LanIP":null,"GUID":null,"DeviceType":' + deviceTypeInt + ',"SocketID":null,"SessionID":"' + inputDeviceGuid + '","DeviceExceptionCmd":' + deviceException + ',"ObligatoryTransmission":true}');

    if (enable === false) {
        switch (deviceType) {
            case 'Skeleton':
                delete KinectSource;
                break;
            case 'Wiimote':
                delete WiiSource;
                break;
            case 'WiiBalanceboard':
                delete WiiSource;
                break;
            case 'Mindwave':
                delete MindwaveSource;
                break;
            case 'RGBVideo':
                delete RGBVideoSource;
                break;
            case 'AndroidSensor':
                delete AndroidSensorSource;
                break;
            default:
                return;
        }

    }
}

function refreshInputDevices() {
    var params = null;
    params = {};
    callInputDeviceKinectRest(false, params, null);
    callInputDeviceWiimoteRest(false, params, null);
    callInputDeviceMindwaveRest(false, params, null);
    callInputDeviceRGBVideoRest(false, params, null);
    try
    {
        ScaleKinectSource($(window).width(), $(window).height());
    }
    catch (exception) {
    }
    remoteCursorUpdate();
    setTimeout(function() {
        refreshInputDevices();
    }, 40);
    return false;
}

function callInputDeviceKinectRest(doasync, ajaxdata, afunc, ajaxID)
{
    jQuery.ajax(
            {
                type: 'GET',
                url: 'http://kedip16.med.auth.gr:8082/rest/GetSkeleton',
                cache: false,
                async: false,
                data: {guid: inputDeviceGuid},
                dataType: "jsonp",
                contentType: "application/json; charset=utf-8",
                success:
                        function(data)
                        {
                            var F = jQuery.parseJSON(data);
                            window.KinectSource = F;
                            if (afunc !== null) {
                                afunc(F);
                            }
                            F = null;
                            data = null;
                        },
                error:
                        function()
                        {
                            alert('Something went wrong...');
                        }
            });
}

function callInputDeviceWiimoteRest(doasync, ajaxdata, afunc, ajaxID)
{
    jQuery.ajax(
            {
                type: 'GET',
                url: 'http://kedip16.med.auth.gr:8082/rest/GetWiimote',
                cache: false,
                async: false,
                data: {guid: inputDeviceGuid},
                dataType: "jsonp",
                contentType: "application/json; charset=utf-8",
                success:
                        function(data)
                        {
                            var F = jQuery.parseJSON(data);
                            window.WiiSource = F;
                            if (afunc !== null) {
                                afunc(F);
                            }
                            F = null;
                            data = null;
                        },
                error:
                        function()
                        {
                            alert('Something went wrong...');
                        }
            });
}
;
function callInputDeviceMindwaveRest(doasync, ajaxdata, afunc, ajaxID)
{
    jQuery.ajax(
            {
                type: 'GET',
                url: 'http://kedip16.med.auth.gr:8082/rest/GetMindwave',
                cache: false,
                async: false,
                data: {guid: inputDeviceGuid},
                dataType: "jsonp",
                contentType: "application/json; charset=utf-8",
                success:
                        function(data)
                        {
                            var F = jQuery.parseJSON(data);
                            window.MindwaveSource = F;
                            if (afunc !== null) {
                                afunc(F);
                            }
                            F = null;
                            data = null;
                        },
                error:
                        function()
                        {
                            alert('Something went wrong...');
                        }
            });
}
;
function callInputDeviceRGBVideoRest(doasync, ajaxdata, afunc, ajaxID)
{
    jQuery.ajax(
            {
                type: 'GET',
                url: 'http://kedip16.med.auth.gr:8082/rest/GetColorVIdeo',
                cache: false,
                async: false,
                data: {guid: inputDeviceGuid},
                dataType: "jsonp",
                contentType: "application/json; charset=utf-8",
                success:
                        function(data)
                        {
                            var F = jQuery.parseJSON(data);
                            window.RGBVideoSource = F;
                            if (afunc !== null) {
                                afunc(F);
                            }
                            F = null;
                            data = null;
                        },
                error:
                        function()
                        {
                            alert('Something went wrong...');
                        }
            });
}

function ScaleKinectSource(width, height) {

    KinectSourceScaled = $.extend(true, {}, KinectSource);
    if (KinectSourceScaled === null)
        return;
    if (KinectSourceScaled.Skeletons === null)
        return;
    for (var sk = 0; sk < window.KinectSourceScaled.Skeletons.length; sk++)
    {
        for (var j = 0; j < window.KinectSourceScaled.Skeletons[sk].Joints.length; j++) {
            window.KinectSourceScaled.Skeletons[sk].Joints[j].Position.X = ScaleJoint(width, 1, window.KinectSourceScaled.Skeletons[sk].Joints[j].Position.X);
            window.KinectSourceScaled.Skeletons[sk].Joints[j].Position.Y = ScaleJoint(height, 1, -window.KinectSourceScaled.Skeletons[sk].Joints[j].Position.Y);
            window.KinectSourceScaled.Skeletons[sk].Joints[j].Position.Z = window.KinectSource.Skeletons[sk].Joints[j].Position.Z;
        }
    }

    return false;
}
;
function ScaleJoint(maxPixel, maxSkeleton, position) {
    var value = ((((maxPixel / maxSkeleton) / 2) * position) + (maxPixel / 2));
    if (value > maxPixel)
        return maxPixel;
    if (value < 0)
        return 0;
    return value;
}

function onSkeletonEvent(SkeletonSourceData) {

    var skeletonEvent = new CustomEvent(
            "skeletonEvent",
            {
                detail: {
                    time: new Date(),
                    SkeletonSourceData: SkeletonSourceData
                },
                bubbles: true,
                cancelable: true
            }
    );
    document.dispatchEvent(skeletonEvent);
}

function onWiiEvent(WiiSourceData) {
    var WiiEvent = new CustomEvent(
            "wiiEvent",
            {
                detail: {
                    time: new Date(),
                    WiiSourceData: WiiSourceData
                },
                bubbles: true,
                cancelable: true
            }
    );
    document.dispatchEvent(WiiEvent);
}

function onMindwaveEvent(MindwaveSourceData) {
    var MindwaveEvent = new CustomEvent(
            "MindwaveEvent",
            {
                detail: {
                    time: new Date(),
                    MindwaveSourceData: MindwaveSourceData
                },
                bubbles: true,
                cancelable: true
            }
    );
    document.dispatchEvent(MindwaveEvent);
}

function onRGBVideoEvent(RGBVideoSourceData) {
    var RGBVideoEvent = new CustomEvent(
            "RGBVideoEvent",
            {
                detail: {
                    time: new Date(),
                    RGBVideoSourceData: RGBVideoSourceData
                },
                bubbles: true,
                cancelable: true
            }
    );
    document.dispatchEvent(RGBVideoEvent);
}


function onAndroidSensorEvent(AndroidSensorSourceData) {
    var AndroidSensorEvent = new CustomEvent(
            "AndroidSensorEvent",
            {
                detail: {
                    time: new Date(),
                    AndroidSensorSourceData: AndroidSensorSourceData
                },
                bubbles: true,
                cancelable: true
            }
    );
    document.dispatchEvent(AndroidSensorEvent);
}

function onCacFrameworkConnect(CacFrameworkStatus) {
    var CacFrameworkEvent = new CustomEvent(
            "CacFrameworkEvent",
            {
                detail: {
                    time: new Date(),
                    CacFrameworkStatus: CacFrameworkStatus
                },
                bubbles: true,
                cancelable: true
            }
    );
    document.dispatchEvent(CacFrameworkEvent);
}