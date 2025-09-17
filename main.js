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

// Pega a referência dos serviços que vamos usar
const db = firebase.firestore();
const storage = firebase.storage();

// Referência do formulário
const beneficiaryForm = document.getElementById('beneficiary-form');

// Envio do Formulário
beneficiaryForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitButton = e.target.querySelector('button');
    submitButton.disabled = true; 
    submitButton.textContent = 'Enviando...';

    console.log("Formulário enviado! Iniciando processo...");

    try {
        // Coletar o arquivo de imagem
        const imageFile = document.getElementById('documentImage').files[0];

        if (!imageFile) {
            alert("Por favor, selecione uma imagem.");
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar Beneficiário';
            return;
        }

        // Comprimir a imagem
        console.log(`Original: ${(imageFile.size / 1024 / 1024).toFixed(2)} MB`);
        const options = {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
        }
        const compressedFile = await imageCompression(imageFile, options);
        console.log(`Comprimida: ${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`);

        // Fazer o upload da imagem comprimida para o Firebase Storage
        console.log("Iniciando upload da imagem comprimida...");
        const storageRef = storage.ref();
        const imageRef = storageRef.child(`documentos/${Date.now()}_${compressedFile.name}`);
        const uploadTask = await imageRef.put(compressedFile);
        const downloadURL = await uploadTask.ref.getDownloadURL();
        console.log("Upload concluído! URL:", downloadURL);

        // Coletar os dados de texto do formulário
        const guardianName = document.getElementById('guardianName').value;
        const guardianCpf = document.getElementById('guardianCpf').value;
        const guardianRg = document.getElementById('guardianRg').value;
        const contactPhone = document.getElementById('contactPhone').value;
        const minorName = document.getElementById('minorName').value;
        const minorAge = document.getElementById('minorAge').value;

        // Montar o objeto final com todos os dados
        const beneficiaryData = {
            guardianName,
            guardianCpf,
            guardianRg,
            contactPhone,
            minors: [{
                name: minorName,
                age: minorAge ? parseInt(minorAge) : null
            }],
            documentImage: downloadURL, // Adicionando o link da imagem
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        };

        // Salvar o objeto completo no Firestore
        await db.collection("beneficiaries").add(beneficiaryData);
        
        alert("Beneficiário cadastrado com sucesso!");
        beneficiaryForm.reset();

    } catch (error) {
        console.error("Ocorreu um erro geral: ", error);
        alert("Ocorreu um erro. Verifique o console para mais detalhes.");
    } finally {
        // Reabilita o botão no final, seja sucesso ou erro
        submitButton.disabled = false;
        submitButton.textContent = 'Salvar Beneficiário';
    }
});
