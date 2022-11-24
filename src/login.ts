

const signUpForm = () => {
  window.api.invoke('sign-in-form')
}

const loginRequest = () => {
  let email = document.getElementById('username') as HTMLInputElement
  let password = document.getElementById('password') as HTMLInputElement
  let data = {
    email: email.value,
    password: password.value
  }
  window.api.invoke('login', data)
    .then(function (res: any) {
      if (res != "err") {        
        console.log(res);
        localStorage.setItem("companyId", res);
        homePage();
      }
      else {
        document.getElementById('error-message').innerText = "メール或いはパスワードが存在していません。"
      }
    })
    .catch(function (err: any) {
      console.log("err");
    });
}

const homePage = () => {
  window.api.invoke('home-page')
}