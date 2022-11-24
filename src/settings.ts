var userAvatarElement: HTMLImageElement;
var userNameElement: HTMLInputElement;
var errorElementText: HTMLElement;
var camera: HTMLMediaElement;
var cameraButton: HTMLElement;
var cameraCapture: HTMLElement;
var localstream;

function capture() {
  let video = document.querySelector("video");
  let image = document.getElementById("userAvatar") as HTMLImageElement;
  let canvas = document.createElement("canvas");
  // scale the canvas accordingly
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  // draw the video at that frame
  canvas.getContext('2d')
    .drawImage(video, 0, 0, canvas.width, canvas.height);
  // convert it to a usable data URL
  let dataURL = canvas.toDataURL();
  image.src = dataURL;
  window.api.store('Set', {
    'is_new_avata': true,
    'new_avatar_path': dataURL
  })
}

async function videoStart() {
  await navigator.mediaDevices.getUserMedia({video: true})
    .then(async function (stream) {
      camera.srcObject = stream;
      cameraButton.setAttribute('onclick', 'videoOff()');
      cameraCapture.hidden = false;
    }).catch(function () {
      alert('could not connect stream');
    });
}

function videoOff() {
  (camera.srcObject as any
  ).getTracks().forEach((track: any) => track.stop());
  cameraCapture.hidden = true;
  cameraButton.setAttribute('onclick', 'videoStart()')
}

function videoPause() {
  camera.pause();
}

async function init() {
  userAvatarElement = document.getElementById('userAvatar') as HTMLImageElement;
  userNameElement = document.getElementById('userName') as HTMLInputElement;
  errorElementText = document.getElementById('error-message');
  camera = document.getElementById('camera') as HTMLMediaElement;
  cameraButton = document.getElementById('cameraStart');
  cameraCapture = document.getElementById('cameraCapture');
}

function openNewAvatar() {
  window.api.invoke('open-upload-avatar').then((res: any) => {
    if (res) {
      userAvatarElement.src = res
      window.api.store('Set', {
        'is_new_avata': true,
        'new_avatar_path': res
      })
    }
  })
}

async function uploadAvatar() {
  let new_avatar_path = await window.api.store('Get', 'new_avatar_path')
  let result = await window.api.invoke('update-user-avatar', new_avatar_path)
  return result
}

async function saveUserProfile() {
  let avatarElement = document.getElementById('userAvatar') as HTMLImageElement;
  let userNameElement = document.getElementById('userName') as HTMLInputElement;
  let is_new_avata = await window.api.store('Get', 'is_new_avata')
  let userName = await window.api.store('Get', 'userName')
  errorElementText.innerText = ""
  if (is_new_avata) {
    let result = await uploadAvatar()
    if (result[0] !== "200") {
      errorElementText.innerText = "ファイルサイズは1MB以下です。"
      return false
    }
    avatarElement.src = result[1]
    userAvatar.src = result[1]
    await window.api.store('Set', {userAvatar: result[1]})
  }
  if (userNameElement.value !== userName) {
    let result = await uploadName()
    if (result) {
      userNameElement.value = result
      await window.api.store('Set', {userName: result})
    }
  }
  window.api.store('Delete', 'is_new_avata')
}

function uploadName() {
  let name = (document.getElementById("userName") as HTMLInputElement
  ).value
  return window.api.invoke('changeName', name).then((res: any) => {
    if (res) {
      return name
    }
    window.api.send('close-modal');
  })
}

async function settingForm() {
  deleteElement("room");
  window.api.store('Delete', 'is_new_avata')
  window.api.store('Delete', 'new_avatar_path')

  let roomForm = document.getElementById('room-list')
  roomForm.innerHTML = await settingHTML()
  init()
}

async function settingHTML() {
  let userName = await window.api.store('Get', 'userName')
  let userAvatar = await window.api.store('Get', 'userAvatar')

  return "<div class=\"userProfile\" id=\"userProfile\" >\n"
         + "            <div class=\"draggable headerProfile\"> ユーザープロフィール</div>\n"
         + "            <div class=\"userName\">\n"
         + "                <div>\n"
         + "                    <label>\n"
         + "                        名前:\n"
         + "                    </label>\n"
         + `                    <input id=\"userName\" value=${userName}>\n`
         + "                </div>\n"
         + "            </div>\n"
         + "            <div class=\"userAvatar\">\n"
         + "                <label>\n"
         + "                    アバター:\n"
         + "                </label>\n"
         + `                <img class=\"imgUserAvatar\" id=\"userAvatar\" src=${userAvatar}>\n`
         + "                <button class=\"uploadImage\" onclick=\"openNewAvatar()\">\n"
         + "                    写真アップロード\n"
         + "                </button>\n"
         + "                <button class=\"camera\" id=\"cameraStart\" onclick=\"videoStart()\">\n"
         + "                    カメラ\n"
         + "                </button>\n"
         + "                <p class=\"error-message\" id=\"error-message\"></p>\n"
         + "                <img src=\"../static/take_picture.png\" class=\"imgCapturePicture\" id=\"cameraCapture\" onclick=\"capture()\" hidden>"
         + "                <video class=\"cameraVideo\" id=\"camera\" autoplay></video>\n"
         + "            </div>\n"
         + "    <div class=\"groupButton\">\n"
         + "        <button class=\"buttonLeft\" onclick=\"saveUserProfile()\">\n"
         + "            保存\n"
         + "        </button>\n"
         + "\n"
         + "        <button class=\"buttonRight\" onclick=\"settingForm()\">\n"
         + "            キャンセル\n"
         + "        </button>\n"
         + "    </div>"
         + "        </div>"
}