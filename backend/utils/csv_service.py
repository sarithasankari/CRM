import pandas as pd
from leads.models import Lead
from leads.serializers import LeadSerializer

def process_lead_csv(file_path, duplicate_strategy='skip', user_id=None):
    from django.contrib.auth import get_user_model
    User = get_user_model()
    user = User.objects.filter(id=user_id).first() if user_id else None

    try:
        df = pd.read_csv(file_path)
    except Exception as e:
        return {"success_count": 0, "errors": [{"row": 0, "error": f"Failed to read CSV: {str(e)}"}]}

    df = df.replace({float('nan'): None})
    
    success_count = 0
    errors = []

    for index, row in df.iterrows():
        data = row.to_dict()
        email = data.get('email')
        
        if not email:
            errors.append({"row": index + 2, "error": "Email is required"})
            continue
            
        existing_lead = Lead.objects.filter(email=email).first()
        
        if existing_lead:
            if duplicate_strategy == 'skip':
                errors.append({"row": index + 2, "error": f"Email {email} already exists (Skipped)"})
                continue
            elif duplicate_strategy == 'update':
                serializer = LeadSerializer(existing_lead, data=data, partial=True)
            else:
                serializer = LeadSerializer(data=data)
        else:
            serializer = LeadSerializer(data=data)

        if serializer.is_valid():
            serializer.save(assigned_to=user)
            success_count += 1
        else:
            errors.append({"row": index + 2, "error": serializer.errors})

    return {"success_count": success_count, "errors": errors}
