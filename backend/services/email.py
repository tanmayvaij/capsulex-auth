import httpx
from core.config import settings

class BaseEmailService:
    async def send_verification_email(self, to_email: str, token: str):
        raise NotImplementedError
        
    async def send_password_reset_email(self, to_email: str, token: str):
        raise NotImplementedError

    async def send_otp_email(self, to_email: str, otp: str):
        raise NotImplementedError



class ZeptoMailService(BaseEmailService):
    def __init__(self, api_key: str, from_address: str):
        self.api_url = "https://api.zeptomail.in/v1.1/email"
        self.api_key = api_key
        self.from_address = from_address
        
    async def _send_email(self, to_email: str, subject: str, htmlbody: str):
        if not self.api_key or not self.from_address:
            print(f"⚠️ ZEPTOMAIL SKIPPED (Missing API Key). Would have sent to {to_email}")
            return
            
        headers = {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Authorization": f"Zoho-enczapikey {self.api_key}"
        }
        payload = {
            "from": {"address": self.from_address},
            "to": [{"email_address": {"address": to_email}}],
            "subject": subject,
            "htmlbody": htmlbody
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.api_url, json=payload, headers=headers)
                response.raise_for_status()
                print(f"✅ ZeptoMail successfully sent to {to_email}")
            except Exception as e:
                print(f"❌ ZeptoMail failed to send to {to_email}: {str(e)}")

    async def send_verification_email(self, to_email: str, token: str):
        # In a real app, this would be a link to the frontend
        htmlbody = f"<div><b>Your verification token is: {token}</b></div>"
        await self._send_email(to_email, "Verify Your Email", htmlbody)

    async def send_password_reset_email(self, to_email: str, token: str):
        # In a real app, this would be a link to the frontend
        htmlbody = f"<div><b>Your password reset token is: {token}</b></div>"
        await self._send_email(to_email, "Reset Your Password", htmlbody)

    async def send_otp_email(self, to_email: str, otp: str):
        htmlbody = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Your Authentication Code</h2>
            <p>Please use the following 6-digit code to log in to your account. This code will expire in 10 minutes.</p>
            <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111;">{otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">If you did not request this code, you can safely ignore this email.</p>
        </div>
        """
        await self._send_email(to_email, "Your Login Code", htmlbody)

class ResendService(BaseEmailService):
    def __init__(self, api_key: str, from_address: str):
        self.api_url = "https://api.resend.com/emails"
        self.api_key = api_key
        self.from_address = from_address
        
    async def _send_email(self, to_email: str, subject: str, htmlbody: str):
        if not self.api_key or not self.from_address:
            print(f"⚠️ RESEND SKIPPED (Missing API Key). Would have sent to {to_email}")
            return
            
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }
        payload = {
            "from": self.from_address,
            "to": [to_email],
            "subject": subject,
            "html": htmlbody
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(self.api_url, json=payload, headers=headers)
                response.raise_for_status()
                print(f"✅ Resend successfully sent to {to_email}")
            except Exception as e:
                print(f"❌ Resend failed to send to {to_email}: {str(e)}")

    async def send_verification_email(self, to_email: str, token: str):
        htmlbody = f"<div><b>Your verification token is: {token}</b></div>"
        await self._send_email(to_email, "Verify Your Email", htmlbody)

    async def send_password_reset_email(self, to_email: str, token: str):
        htmlbody = f"<div><b>Your password reset token is: {token}</b></div>"
        await self._send_email(to_email, "Reset Your Password", htmlbody)

    async def send_otp_email(self, to_email: str, otp: str):
        htmlbody = f"""
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #333;">Your Authentication Code</h2>
            <p>Please use the following 6-digit code to log in to your account. This code will expire in 10 minutes.</p>
            <div style="background-color: #f4f4f5; padding: 16px; border-radius: 8px; text-align: center; margin: 24px 0;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #111;">{otp}</span>
            </div>
            <p style="color: #666; font-size: 14px;">If you did not request this code, you can safely ignore this email.</p>
        </div>
        """
        await self._send_email(to_email, "Your Login Code", htmlbody)

from fastapi import Depends
from models.project import Project
from api.deps import get_project_from_api_key

async def get_email_service(project: Project = Depends(get_project_from_api_key)) -> BaseEmailService:
    config = project.mail_config or {}
    provider = config.get("provider", "none")
    
    if provider == "none":
        print(f"⚠️ Mail provider is set to 'none' for project {project.id}. Emails will be skipped.")
        return ZeptoMailService("", "")
        
    if provider == "resend":
        api_key = config.get("resendApiKey")
        from_address = config.get("resendFromAddress")
        if api_key and from_address:
            return ResendService(api_key, from_address)
        else:
            print(f"⚠️ Resend is missing API keys for project {project.id}. Emails will be skipped.")
            return ResendService("", "")
            
    if provider == "zeptomail":
        api_key = config.get("apiKey")
        from_address = config.get("fromAddress")
        if api_key and from_address:
            return ZeptoMailService(api_key, from_address)
        else:
            print(f"⚠️ ZeptoMail is missing API keys for project {project.id}. Emails will be skipped.")
            return ZeptoMailService("", "")
            
    # Default fallback
    return ZeptoMailService("", "")
