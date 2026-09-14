document
.getElementById("loginForm")
.addEventListener("submit", async (e) => {


    e.preventDefault();



    const email = document
    .getElementById("email")
    .value;



    const password = document
    .getElementById("password")
    .value;



    const mensaje = document
    .getElementById("mensaje");



    try {


        const respuesta = await fetch("/api/auth/login", {


            method: "POST",


            headers: {

                "Content-Type": "application/json"

            },


            body: JSON.stringify({

                email: email,

                password: password

            })


        });




        const data = await respuesta.json();




        console.log("Respuesta login:", data);




        if(data.error){


            mensaje.textContent = data.error;

            return;


        }





        // Guardar sesión


        localStorage.setItem(
            "token",
            data.token
        );


        localStorage.setItem(
            "usuarioID",
            data.usuario.id
        );


        localStorage.setItem(
            "usuarioNombre",
            data.usuario.nombre
        );


        localStorage.setItem(
            "usuarioEmail",
            data.usuario.email
        );


        localStorage.setItem(
            "usuarioRol",
            data.usuario.rol
        );






        mensaje.textContent =
        "Inicio de sesión correcto ✅";





        console.log(
            "Usuario guardado:",
            data.usuario
        );





        // Redirección


        setTimeout(()=>{


            window.location.href = "/dashboard.html";


        },1000);






    } catch(error){



        console.error(
            "Error login:",
            error
        );



        mensaje.textContent =
        "Error conectando con el servidor";


    }



});