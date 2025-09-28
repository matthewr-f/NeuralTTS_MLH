const usernameText = document.getElementById("username");
const passwordText = document.getElementById("password");
const reenterPassword = document.getElementById("passwordAgain");

const submitBtn = document.querySelector("button")

submitBtn.addEventListener("click", () => {
    document.querySelectorAll(".invalid").forEach(el => {
        el.style.display = "none";
    });
    if (usernameText.value.trim() === "") {
    document.getElementsByClassName("invalid empty-username")[0].style.display = "block";
    }
    if (passwordText.value.trim() === "") {
        document.getElementsByClassName("invalid empty-password")[0].style.display = "block";
    }
    if (passwordText.value.trim() !== "" && reenterPassword.value.trim() === "") {
        document.getElementsByClassName("invalid empty-confPassword")[0].style.display = "block";
    }
    if (usernameText.value.trim() !== "" && passwordText.value.trim() !== "" && reenterPassword.value.trim() !== "" && passwordText.value !== reenterPassword.value) {
        document.getElementsByClassName("invalid different-match")[0].style.display = "block"
    }
})