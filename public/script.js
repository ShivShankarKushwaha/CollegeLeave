let official = document.querySelector('.logo-details');
official.addEventListener('click',function()
{
    // window.location.href ='http://iiitu.ac.in/';
    window.open('http://iiitu.ac.in/','_blank')
})

let logout = document.getElementById('logout');
let statusbtn = document.getElementById('status');
let loginbtn = document.getElementById('loginbtn');

async function getuser()
{
    console.log('getuser called');
    const option={
    method:'POST',
    body: new URLSearchParams({param:'data'})
    };
    fetch('/getuser',option)
    .then((responce)=>
    {
        if(responce.status!=200)
        {
            console.log('no user');
            logout.style.display = "none";
            statusbtn.style.display = "none";
            loginbtn.style.display = "block";
        }
        else
        {
            logout.style.display = "block";
            statusbtn.style.display = "block";
            loginbtn.style.display = "none";
        }
    });
    console.log('getuser exit');
}
getuser();