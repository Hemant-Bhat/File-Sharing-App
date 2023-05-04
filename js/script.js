import { initializeApp } from "https://www.gstatic.com/firebasejs/9.21.0/firebase-app.js";
import {
  getStorage,
  ref,
  listAll,
  uploadBytesResumable,
  deleteObject,
  getDownloadURL,
  updateMetadata,
  getMetadata,
} from "https://www.gstatic.com/firebasejs/9.21.0/firebase-storage.js";

const firebaseConfig = {
  storageBucket: "gs://file-sharing-app-58751.appspot.com",
};

const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const listRef = ref(storage, "uploads");

const file = document.getElementById("fileInput");
const uidInput = document.getElementById("uidInput");

const progressTrack = document.getElementById("progress-track");
const progressDiv = document.getElementById("progress");
const progressPer = document.getElementById("progressPer");

const uploadBtn = document.getElementById("uploadBtn");
const downloadInfo = document.getElementById("downloadInfo");
const downloadBtn = document.getElementById("downloadBtn");
const downloadLink = document.getElementById("downloadLink");
const uploadErr = document.getElementById("upload-err");
const downloadErr = document.getElementById("download-err");

function generateUniqueID() {
  var id = Math.floor(Math.random() * 9999999);
  return id;
}

function upload() {
  uploadErr.innerText = "";
  uuidText.innerText = "";
  downloadInfo.style.display = "none";
  progressTrack.style.display = "none";
  if (file.files.length != 0) {
    let upfile = file.files[0];
    let ext = upfile.name.split(".").pop();
    console.log(ext);
    const storageRef = ref(
      storage,
      "uploads/" + new Date().getTime() + "." + ext
    );
    var uploadTask = uploadBytesResumable(storageRef, upfile);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        progressTrack.style.display = "block";
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log(progress);
        progressDiv.style.width = progress + "%";
        progressPer.innerText = Math.round(progress) + "%";
      },
      (error) => {
        uploadErr.innerText = error;
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          var uId = generateUniqueID();
          updateMetadata(storageRef, {
            customMetadata: {
              uuid: uId,
            },
          }).then((metadata) => {
            fileInput.value = "";
            downloadInfo.style.display = "block";
            uuidText.innerText = "File ID: " + uId;
            downloadLink.innerText = `${window.location.href}?fileUID=${uId}`;
          });
        });
      }
    );
  } else {
    uploadErr.innerText = "Please select a file.";
  }
}

async function download() {
  downloadErr.innerText = "";
  let flag = false;
  var promises = [];
    var c;
    var res = await listAll(listRef);
    var file = res.items.forEach((i) => {
      promises.push(
        new Promise((resolve, reject) => {
          getMetadata(i).then((d) => {
            uidInput.value === d.customMetadata.uuid
              ? resolve(d)
              : reject(null);
          });
        })
      );
    });
    Promise.any(promises).then(f => {
      if (f) {
        // flag = true;
        var fileRef = ref(storage, f.fullPath);
        getDownloadURL(fileRef).then((url) => {
          window.open(url, "_blank");
        }).then(()=>{
          setTimeout(() => {
            deleteObject(fileRef).then(() => {
              console.log("File has been deleted")
            })
          }, 1000)
        });
      }
    }).catch(err => {
      downloadErr.innerText = "File not found";
    })
//   await listAll(listRef).then((res) => {
//       res.items.forEach((i) => {
//         (async () => {

//         var c = await getMetadata(i).then((d) =>
//             uidInput.value === d.customMetadata.uuid
//               ? d
//               : null
//           )
//           console.log(c)
//           //   .then((file) => {
//           //     if (file) {
//           //       resolve(file);
//           //       flag = true;
//           //       var fileRef = ref(storage, file.fullPath);
//           //       getDownloadURL(fileRef).then((url) => {
//           //         window.open(url, "_blank");
//           //       });
//           //     }
//           //   })
//         })();  

//       });
//     });

//   a.then((v) => console.log(v)).finally(() => console.log("final"));
//   Promise.all(promises)
//     .then((file) => {
//         console.log(file)
//       promises.map((promise) => Promise.resolve(promise));
//     })
    // .then(() => {
    //   if (flag == false) {
    //     downloadErr.innerText = "File not found";
    //   }
    //   console.log("YYYY");
    // });
}

uploadBtn.addEventListener("click", upload);
downloadBtn.addEventListener("click", download);

window.addEventListener("load",function(){
  const url = new URL(window.location.href);
  let id = url.searchParams.get("fileUID");
  if(id){
    document.getElementById("uploadContainer").style.display = "none";
    document.getElementById("shareMoreContainer").style.display = "block";
    uidInput.value = id;
    download();
  }
})