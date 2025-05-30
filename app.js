require('dotenv').config();
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 3000;

// Função para fazer scraping
async function getWeather() {
    try {
        const { data } = await axios.get('https://www.climatempo.com.br/previsao-do-tempo/cidade/558/saopaulo-sp');
        const $ = cheerio.load(data);

        const temperatura = $('.-gray.-line-height-24._margin-r-5').first().text().trim();
        const condicao = $('.-gray._flex._align-center').first().text().trim();

        return {
            temperatura: temperatura || 'Não encontrado',
            condicao: condicao || 'Não encontrado'
        };

    } catch (error) {
        console.error('Erro no scraping:', error);
        return null;
    }
}

// Função para enviar email
async function sendEmail(weather) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const message = {
        from: process.env.EMAIL_USER,
        to: process.env.EMAIL_TO,
        subject: '☀️ Previsão do Tempo - São Paulo',
        text: `Bom dia!\n\nA previsão do tempo para hoje é:\n\n🌡️ Temperatura: ${weather.temperatura}\n🌥️ Condição: ${weather.condicao}\n\nTenha um ótimo dia!`
    };

    try {
        await transporter.sendMail(message);
        console.log('✅ Email enviado com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao enviar email:', error);
    }
}

// Endpoint HTTP
app.get('/send-weather', async (req, res) => {
    const weather = await getWeather();

    if (weather) {
        await sendEmail(weather);
        res.json({ status: 'Email enviado com sucesso!', weather });
    } else {
        res.status(500).json({ status: 'Erro ao obter dados do clima' });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
