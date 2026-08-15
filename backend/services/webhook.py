import httpx
import hmac
import hashlib
import json
from sqlalchemy.orm import Session
from models.webhook import Webhook

class WebhookService:
    @staticmethod
    def _generate_signature(secret: str, payload: dict) -> str:
        payload_str = json.dumps(payload, separators=(',', ':'))
        return hmac.new(
            secret.encode('utf-8'),
            payload_str.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()

    @staticmethod
    async def dispatch_event(db: Session, project_id: int, event_type: str, payload_data: dict):
        webhooks = db.query(Webhook).filter(
            Webhook.project_id == project_id,
            Webhook.is_active == True
        ).all()

        if not webhooks:
            return

        payload = {
            "event": event_type,
            "data": payload_data
        }

        async with httpx.AsyncClient() as client:
            for webhook in webhooks:
                if event_type in webhook.events or "*" in webhook.events:
                    signature = WebhookService._generate_signature(webhook.secret, payload)
                    headers = {
                        "Content-Type": "application/json",
                        "X-Capsulex-Signature": signature
                    }
                    
                    try:
                        response = await client.post(
                            webhook.url, 
                            json=payload, 
                            headers=headers,
                            timeout=5.0
                        )
                        print(f"✅ Webhook {event_type} dispatched to {webhook.url} - Status: {response.status_code}")
                    except Exception as e:
                        print(f"❌ Webhook {event_type} failed for {webhook.url}: {str(e)}")
