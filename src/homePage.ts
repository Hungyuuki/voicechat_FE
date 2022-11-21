function openRoomCreate() {
  window.api.send("open-room-create");
}

function handleUploadImage() {
  window.api.on("open-upload-image", (evt: Event, base64: string) => {
    const src = `data:image/jpg;base64,${base64}`;
  });
}

function openUploadImage() {
  window.api.invoke("open-upload-image").then(function (res: any) {
    if (!res) {
      return;
    }
    let url = res.icon_images;
    let id = res.id;

    let liEle = document.createElement("li");
    let elem = document.createElement("img");
    elem.setAttribute("src", url);
    elem.setAttribute("onclick", `setRoomIconId(${id})`);
    elem.style.cursor = "pointer";
    liEle.appendChild(elem);
    document.getElementById("images").appendChild(liEle);
    setRoomIconId(res.id);
  });
}

function getListImage(company_id: number) {
  window.api.axios("/room_icons/active", company_id).then(function (res: any) {
    for (let k = 0; k < res.room_icons[0].length; k++) {
      let liEle = document.createElement("li");
      let elem = document.createElement("img");
      elem.setAttribute("src", res.room_icons[0][k].icon_images);
      elem.setAttribute("onclick", `setRoomIconId(${res.room_icons[0][k].id})`);
      liEle.appendChild(elem);
      if (document.getElementById("images")) {
        document.getElementById("images").appendChild(liEle);
      }
    }
  });
}

function setRoomIconId(id: number) {
  window.api.store("Set", { room_icon_id: id });
  return true;
}

function createRoomChat() {
  window.api
    .store("Get", "floor_id")
    .then(function (floor_id: number | string) {
      window.api
        .store("Get", "room_icon_id")
        .then(function (room_icon_id: number | string) {
          const roomName = (
            document.getElementById("roomName") as HTMLInputElement
          ).value;
          const roomData = {
            floor_id: floor_id,
            name: roomName,
            room_icon_id: room_icon_id,
          };
          window.api
            .axios("/rooms", roomData)
            .then(function (res: any) {
              if (res.room_id) {
                window.api.send("reloadMainWindow");
                return closeModalWindow();
              }
            })
            .catch(function (erorr: any) {
              //handle exception
            });
        });
    });
}

window.api
  .store("Get", "floor_id")
  .then(function (floor_id: number | string) {
    getPageFloor(floor_id ?? 0);
  })
  .catch(function (floor_id: any) { });

window.api
  .store("Get", "company_id")
  .then(function (company_id: any) {
    getListImage(company_id);
  })
  .catch(function (e: any) { });
// localStorage.removeItem("floorId");

function showFloor(id: any) {
  deleteElement("room");
  deleteElement("floors");
  // Add div floor
  let elFloors = ` <div class="floors" id="floors" height=1400> </div>`;
  addElement(elFloors, "floor-list");

  // Add div room
  let elRooms = `<div class="room" id="room"> </div>`;
  addElement(elRooms, "room-list");
  localStorage.setItem("floorId", id);
  getPageFloor(id);
}

function getPageFloor(floor_id: any) {
  window.api
    .invoke("getFloor", localStorage.getItem("companyId"))
    .then(function (res: any) {
      if (res == "error") {
        let elButtonAdd = `<div class="add button" onclick="addFloor()" id="add">+</div>`;
        addElement(elButtonAdd, "floors");
      } else {
        localStorage.setItem("floorHighest", res.floors[0][0].id);
        for (let id = 0; id < res.floors[0].length; id++) {
          if (floor_id == res.floors[0][id].id) {
            floor_id = id;
            break;
          }
        }
        window.api
          .invoke("getRoomsByStatusAndFloorId", res.floors[0][floor_id].id)
          .then(function (result: any) {
            let position_px = 0;
            let index = 0;
            for (let k = 0; k < res.floors[0].length; k++) {
              if (k == floor_id) {
                window.api.store("Set", {
                  floor_id: res.floors[0][floor_id].id,
                });
                let elFloors = `
                                    <div class="floor" style="top: ${position_px}px; background-color: #7f7f7f; z-index: 1000;" id=${k} onclick="showFloor(${res.floors[0][k].id})" > <p>${res.floors[0][k].name} </p></div>
                                `;
                addElement(elFloors, "floors");
              } else {
                index += 1;
                let elFloors = `
                                    <div class="floor" style="top: ${position_px}px; background-color: #dbdbdb;z-index: ${index};" id=${k} onclick="showFloor(${res.floors[0][k].id})" > <p>${res.floors[0][k].name} </p></div>
                                `;
                addElement(elFloors, "floors");
              }
              position_px += 50;
            }
            let elButtonAdd = `<div class="floor add-new" style="top: ${position_px}px; background-color: black; z-index: -1;" onclick="addFloor()"><p>+</p></div>`;
            addElement(elButtonAdd, "floors");
            for (let i = 0; i < result.rooms[0].length; i++) {
              let elRoom = `
              <div id="room-${result.rooms[0][i].room_id}">
              <div class="header-room button"  onclick="joinRoom(${result.rooms[0][i].room_id})">
                  <img src=${result.rooms[0][i].icon_images} alt="">
                  <h4 class="button">${result.rooms[0][i].room_name}</h4>
              </div>
              <div id="info-user-room-${result.rooms[0][i].room_id}">
                <div id="your-proflie-${result.rooms[0][i].room_id}"></div>
              </div>
              </div>
          `;
              addElement(elRoom, "room");
              window.api
                .invoke(
                  "getActiveRoomUsersByRoomId",
                  result.rooms[0][i].room_id
                )
                .then(function (resultUsers: any) {
                  for (let j = 0; j < resultUsers.room_users[0].length; j++) {
                    let text = `
                    <div class="user">
                    <div class="logo-user button"><img src=${resultUsers.room_users[0][j].user_avatar}></div>
                    <h4 class="button">${resultUsers.room_users[0][j].user_name}</h4>
                    <i class="fa-solid fa-calendar-days button"></i>
                    <div class="status">
                    <a id="1">多忙中</a>
                    <a id="2">離席中</a>
                    </div>
                    <div class="mic button" onclick="changeStatusMic(${resultUsers.room_users[0][j].user_id})">
                      <i class="fa-solid fa-microphone" style="display: none;" id="mic-on-${resultUsers.room_users[0][j].user_id}"></i>
                      <i class="fa-solid fa-microphone-slash" id="mic-off-${resultUsers.room_users[0][j].user_id}"></i>
                    </div>
                    <div class="headphone button" onclick="changeStatusSpeaker(${resultUsers.room_users[0][j].user_id})">
                      <i class="fa-solid fa-headphones" id="speaker-on-${resultUsers.room_users[0][j].user_id}" style="display: none;"></i>
                      <img src="../static/earphone.png"  class="fa-solid fa-earphones" id="speaker-off-${resultUsers.room_users[0][j].user_id}" style="width: 20px; height: 20px;" >
                    </div>
                </div>
            `;
                    addElement(text, `room-${result.rooms[0][i].room_id}`);
                  }
                })
                .catch(function (err: any) {
                  console.error(err);
                });
            }
          })
          .catch(function (err: any) {
            console.error(err);
          });
      }
    })
    .catch(function (err: any) {
      console.error(err);
    });
}

function addFloor() {
  let floor = document.getElementsByClassName("floor");
  if (floor.length > 10) {
    console.log("Fails");
  } else {
    let text = `
            <div class="add" id="add">
            <p>フロア名</p>
            <div class="input" > <input type="text" id="input"> </div>
            <div class="btn">
                <button class="cancel" onclick="cancelCreate()">キャンセル</button>
                <button class="confirm" onclick="confirmCreate()">追加</button>
            </div>
            </div>
        `;
    addElement(text, "add-floor");
  }
}

function addWarring(text: string) {
  let boxWarring = document.getElementById("warring");
  if (boxWarring != null || boxWarring != undefined) {
    boxWarring.parentNode.removeChild(boxWarring);
    let elWarring = `
                <p class="warring" id="warring" style= "margin-top: -20px;"> ${text} <p>
            `;
    addElement(elWarring, "add");
  } else {
    let elWarring = `
            <p class="warring" id="warring"> ${text} <p>
        `;
    addElement(elWarring, "add");
  }
}

function cancelCreate() {
  deleteElement("add");
}

function confirmCreate() {
  let nameFloor = document.getElementById("input") as HTMLInputElement;

  let data = {
    name: nameFloor.value,
  };

  if (nameFloor.value.length == 0) {
    addWarring("* フロアー名を入力して下さい");
  } else if (nameFloor.value.length > 10) {
    addWarring("* 文字数は全角10文字以内で入力して下さい");
  } else {
    window.api
      .invoke("addFloor", data)
      .then(function (res: any) {
        if (res != "Fails") {
          showFloor(res.floor_id);
          deleteElement("add");
        } else {
          deleteElement("add");
          let text = `
                        <div class="add" id="add">
                        <p>作成に失敗しました</p>
                        </div>
                    `;
          addElement(text, "add-floor");
        }
      })
      .catch(function (err: any) {
        console.error(err);
      });
  }
}

function addElement(text: string, elId: any) {
  let elAdd = document.createElement("div");
  elAdd.innerHTML = text;
  let boxEl = document.getElementById(elId);
  boxEl?.appendChild(elAdd);
}

function deleteElement(elId: any) {
  let el = document.getElementById(elId);
  el.remove();
}

function closeWindown() {
  window.api.send("open-confirm-modal");
}

function minimizeWindown() {
  window.api
    .invoke("minimize-window", "")
    .then(function (res: any) {
      if (res == "Done") {
        console.log("Done");
      }
    })
    .catch(function (err: any) {
      console.error(err);
    });
}

let coutClick = 0;

function pinWindown() {
  coutClick++;
  if (coutClick % 2 == 0) {
    window.api
      .invoke("set-window-off-top", "")
      .then(function (res: any) {
        if (res == "Done") {
          console.log("Done");
        }
      })
      .catch(function (err: any) {
        console.error(err);
      });
  } else {
    window.api
      .invoke("set-window-on-top", "")
      .then(function (res: any) {
        if (res == "Done") {
          console.log("Done");
        }
      })
      .catch(function (err: any) {
        console.error(err);
      });
  }
}

function getMemberList() {
  deleteElement("room");
  let text = `
  <div class="room" id="room">
  </div>
`;
  addElement(text, "room-list");

  window.api
    .invoke("get-users-company", "")
    .then(function (res: any) {
      if (res == "error") {
        console.log("error");
      } else {
        for (let i = 0; i < res.users_company[0].length; i++) {
          let check;
          if (res.users_company[0][i].role == "admin") {
            check = "block";
          } else {
            check = "none";
          }
          let text = `
        <div class="user" style="width: 280px;">
        <div class="logo"><img src="${res.users_company[0][i].avatar}"></div>
        <div ><img src="../static/crown.png" style="margin-left: -9px; display: ${check}"  width="10px" height="10px"></div>

            <h4>${res.users_company[0][i].onamae}</h4>
            <i class="fa-solid fa-calendar-days"></i>
            <i class="fa-solid fa-microphone-slash"></i>
            <i class="fa-solid fa-headphones"></i>
        </div>
      `;
          addElement(text, "room");
        }
      }
    })
    .catch(function (err: any) {
      console.error(err);
    });
}

// Change Status Mic, Speaker
function changeStatus(idElementOn: any, idElementOff: any) {
  let elementOn = document.getElementById(idElementOn);
  elementOn.style.display = "none";

  let elementOff = document.getElementById(idElementOff);
  elementOff.style.display = "inline";
}

function changeStatusMic(id: any) {
  let userId = localStorage.getItem("userId");
  if (id == "0") {
    id = userId;
  }
  if (userId == id) {
    window.api
      .invoke("change-status-mic", "")
      .then(function (res: any) {
        if (res.result[0].is_mic == 0) {
          changeStatus("mic-on", "mic-off");
          changeStatus(`mic-on-${userId}`, `mic-off-${userId}`);
          leaveChannel();
        } else {
          changeStatus("mic-off", "mic-on");
          changeStatus(`mic-off-${userId}`, `mic-on-${userId}`);
          joinChannel("mic-on");
        }
      })
      .catch(function (err: any) {
        console.error(err);
      });
  }
}

window.api
  .invoke("get-user-id", "")
  .then(function (res: any) {
    localStorage.setItem("userId", res);
  })
  .catch(function (err: any) {
    console.error(err);
  });

function changeStatusSpeaker(id: any) {
  let userId = localStorage.getItem("userId");
  if (id == "0") {
    id = userId;
  }
  if (userId == id) {
    window.api
      .invoke("change-status-speaker", "")
      .then(function (res: any) {
        if (res.result[0].is_speaker == 0) {
          changeStatus("speaker-on", "speaker-off");
          changeStatus(`speaker-on-${userId}`, `speaker-off-${userId}`);
        } else {
          changeStatus("speaker-off", "speaker-on");
          changeStatus(`speaker-off-${userId}`, `speaker-on-${userId}`);
        }
      })
      .catch(function (err: any) {
        console.error(err);
      });
  }
}

function joinRoom(id: any) {
  let data = {
    room_id: id,
  };
  window.api
    .invoke("change-room", data)
    .then(function (res: any) {
      if (res == "error") {
        return;
      } else {
        let floorId = localStorage.getItem("floorId");
        if (floorId == "" || floorId == undefined || floorId == null) {
          showFloor(localStorage.getItem("floorHighest"));
        } else {
          showFloor(floorId);
        }
        document.location.reload();
      }
    })
    .catch(function (err: any) {
      console.error(err);
    });
}

function joinChannel(statusMic: any) {
  window.api
    .invoke("channel-Agora", "")
    .then(function (data: any) {
      data.statusMic = statusMic;
      window.api
        .agoraVoice(data)
        .then(function (res: any) { })
        .catch(function (err: any) {
          console.error(err);
        });
    })
    .catch(function (err: any) {
      console.error(err);
    });
}

function leaveChannel() {
  window.api
    .invoke("channel-Agora", "")
    .then(function (data: any) {
      data.statusMic = "mic-off";
      window.api
        .agoraVoice(data)
        .then(function (res: any) { })
        .catch(function (err: any) {
          console.error(err);
        });
    })
    .catch(function (err: any) {
      console.error(err);
    });
}

function changeSelected(){
  let dropupContent = document.getElementById('dropup-content');
  window.onmousemove = function(event) {
    if (event.target == dropupContent) {
      dropupContent.style.display = "none";
    }
    dropupContent.style.display = "block";
} 
};



window.onload = function(){
	  var dropup = document.getElementById('dropup');
    var dropupContent = document.getElementById('dropup-content');
    var status = document.getElementById('status');
    var overlay = document.getElementById('backgroundOverlay');
    document.onclick = function(e){
        if(e.target == status){
          dropup.style.display = 'block';
          dropupContent.style.display = 'block';
          overlay.style.display = 'block';
        }
        if(e.target == overlay){
          dropup.style.display = 'block';
          dropupContent.style.display = 'none';
          overlay.style.display = 'none';
        }
        if(e.target == dropupContent){
          dropup.style.display = 'block';
          dropupContent.style.display = 'none';
          overlay.style.display = 'none';
          status.style.display = 'block';
        }
    };
};


  // document.getElementById("busy").onclick = function() {
  //   alert("多忙中");
  //   console.log("1");
  // };
  // document.getElementById("left").onclick = function() {
  //   alert("離席中");
  //   console.log("2");
  // };




  document.getElementById("busy").onclick = function() {
    let left = document.getElementById('2');
    let busy = document.getElementById('1');
        document.onclick = function(e){
          console.log('1111111');
              if(e.target == busy){
              busy.style.display = 'block';
              left.style.display = 'none';
            };
        };
      };
  
  document.getElementById("left").onclick = function() {
    let left = document.getElementById('2');
    let busy = document.getElementById('1');
        document.onclick = function(e){
          console.log('2222222');
              if(e.target == left){
              left.style.display = 'block';
              busy.style.display = 'none';
            };
        };
    };
  



  // window.onload = function(){
  // let left = document.getElementById('left');
  // let busy = document.getElementById('busy');
  //     document.onclick = function(e){
  //           if(e.target == busy){
  //           busy.style.display = 'block';
  //           left.style.display = 'none';
  //         };
  //     };
  //     document.onclick = function(e){
  //           if(e.target == left){
  //           left.style.display = 'block';
  //           busy.style.display = 'none';
  //         };
  //     };
  // };