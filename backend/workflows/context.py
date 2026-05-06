import threading

# Thread-local storage for workflow execution context.
# Stores:
# - captured field values (for stage change detection)
# - chain_id (for loop prevention and audit trails)
_state = threading.local()

def get_chain_id():
    return getattr(_state, 'chain_id', None)

def set_chain_id(chain_id):
    _state.chain_id = chain_id

def clear_chain_id():
    if hasattr(_state, 'chain_id'):
        del _state.chain_id
