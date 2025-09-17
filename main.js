const firebaseConfig = {
    apiKey: "AIzaSyAJPoSfyUbPeqaNyjhNfnZfWH1QpYeTtr0",
    authDomain: "oaiprojeto.firebaseapp.com",
    projectId: "oaiprojeto",
    storageBucket: "oaiprojeto.appspot.com",
    messagingSenderId: "460090529988",
    appId: "1:460090529988:web:e420b868da822e61dc9191",
    measurementId: "G-V0RKL2XGL2"
};
  
// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);

// Firestore
const db = firebase.firestore();

// Formulário
const beneficiaryForm = document.getElementById('beneficiary-form');

beneficiaryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button');
    submitButton.disabled = true;
    submitButton.textContent = 'Enviando...';

    console.log("Formulário enviado! Iniciando processo...");

    try {
        // 1. Arquivo da imagem
        const imageFile = document.getElementById('documentImage').files[0];
        if (!imageFile) {
            alert("Por favor, selecione uma imagem.");
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Beneficiário';
            return;
        }

        // 2. Compressão
        console.log(`Original: ${(imageFile.size / 1024 / 1024).toFixed(2)} MB`);
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        }
        const compressedFile = await imageCompression(imageFile, options);
        console.log(`Comprimida: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

        // 3. Upload no Cloudinary
        const formData = new FormData();
        formData.append("file", compressedFile);
        formData.append("upload_preset", "meu_preset"); // configure no painel

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dz995efd6/image/upload",
          { method: "POST", body: formData }
        );

        const data = await response.json();
        if (!data.secure_url) {
            throw new Error("Falha no upload para Cloudinary: " + JSON.stringify(data));
        }
        const imageUrl = data.secure_url;
        console.log("Imagem hospedada em:", imageUrl);

        // 4. Dados do formulário
        const guardianName = document.getElementById('guardianName').value;
        const guardianCpf = document.getElementById('guardianCpf').value;
        const guardianRg = document.getElementById('guardianRg').value;
        const contactPhone = document.getElementById('contactPhone').value;
        const minorName = document.getElementById('minorName').value;
        const minorAge = document.getElementById('minorAge').value;

        // 5. Montar objeto
        const beneficiaryData = {
            guardianName,
            guardianCpf,
            guardianRg,
            contactPhone,
            minors: [{
                name: minorName,
                age: minorAge ? parseInt(minorAge) : null
            }],
            documentImage: imageUrl, // agora vem do Cloudinary
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        // 6. Salvar no Firestore
        await db.collection("beneficiaries").add(beneficiaryData);
        
        alert("Beneficiário cadastrado com sucesso!");
        beneficiaryForm.reset();

    } catch (error) {
        console.error("Ocorreu um erro geral: ", error);
        alert("Ocorreu um erro. Verifique o console para mais detalhes.");
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar Beneficiário';
    }
});
