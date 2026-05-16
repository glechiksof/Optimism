"""Shared slowapi limiter instance. Keeps decorator and middleware in sync."""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
