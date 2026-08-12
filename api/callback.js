export default async function handler(req, res) {
    const { code } = req.query;
    
    // Se não tiver código, devolve pra tela de erro
    if (!code) {
        return res.redirect('/?status=error');
    }

    try {
        // 1. Troca o código pelo Token de Acesso do usuário
        const tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
                client_id: process.env.CLIENT_ID,
                client_secret: process.env.CLIENT_SECRET,
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json();
        
        if (!tokenData.access_token) {
            return res.redirect('/?status=error');
        }

        // 2. Descobre quem é o usuário que está logando
        const userResponse = await fetch('https://discord.com/api/users/@me', {
            headers: {
                authorization: `${tokenData.token_type} ${tokenData.access_token}`
            }
        });

        const userData = await userResponse.json();
        const userId = userData.id;

        // 3. Usa o Bot para dar o cargo Verificado e tirar o Não Verificado
        const guildId = process.env.GUILD_ID;
        const roleVerified = process.env.ROLE_VERIFIED;
        const roleUnverified = process.env.ROLE_UNVERIFIED;
        const botToken = process.env.BOT_TOKEN;

        // Adiciona Cargo Verificado
        await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleVerified}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bot ${botToken}` }
        });

        // Remove Cargo Não Verificado
        await fetch(`https://discord.com/api/v10/guilds/${guildId}/members/${userId}/roles/${roleUnverified}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bot ${botToken}` }
        });

        // 4. Redireciona o usuário de volta para o seu site HTML com o status de SUCESSO!
        return res.redirect('/?status=success');

    } catch (error) {
        console.error('Erro na API:', error);
        return res.redirect('/?status=error');
    }
}