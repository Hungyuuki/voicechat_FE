const closeModalWindow = () => {
  window.api.send('close-modal')
}

const closeWindow = () => {
  window.api.send("close-window")
}
