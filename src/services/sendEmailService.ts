import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export const sendConfirmationEmail = async (toEmail: string, token: string) => {
  const confirmationLink = `${process.env.FRONTEND_URL}/confirm-email?token=${token}`;

  const command = new SendEmailCommand({
    Source: process.env.AWS_SES_SENDER_EMAIL!,
    Destination: { ToAddresses: [toEmail] },
    Message: {
      Subject: { Data: 'Confirme sua conta no Geoservice' },
      Body: {
        Html: {
          Data: `
            <h1>Bem-vindo ao Geoservice!</h1>
            <p>Por favor, clique no link abaixo para confirmar seu endereço de e-mail:</p>
            <a href="${confirmationLink}">Confirmar meu e-mail</a>
            <p>Se você não solicitou este cadastro, por favor, ignore este e-mail.</p>
          `,
        },
      },
    },
  });

  try {
    await sesClient.send(command);
    console.log(`E-mail de confirmação enviado para ${toEmail}`);
  } catch (error) {
    console.error('Erro ao enviar e-mail pelo SES:', error);
    throw new Error('Não foi possível enviar o e-mail de confirmação.');
  }
};
