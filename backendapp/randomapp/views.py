from django.shortcuts import render
from django.http import JsonResponse
import random

# Create your views here.

def random_paragraph(request):
    """Generate a random paragraph with 10 lines"""
    sentences = [
        "The quick brown fox jumps over the lazy dog.",
        "Python is a versatile programming language.",
        "Django makes web development easier and faster.",
        "Random text generation can be useful for testing.",
        "Machine learning is transforming technology.",
        "APIs connect different software applications.",
        "Data structures are fundamental to programming.",
        "Frontend and backend work together seamlessly.",
        "Code quality matters for maintainable projects.",
        "Testing ensures your application works correctly.",
        "Deployment brings your application to users.",
        "Version control helps teams collaborate effectively.",
        "Databases store and organize your data.",
        "Security should always be a priority.",
        "User experience determines application success."
    ]
    
    # Select 10 random sentences
    paragraph_lines = random.sample(sentences, 10)
    paragraph = "\n".join(paragraph_lines)
    
    return JsonResponse({
        'paragraph': paragraph,
        'lines': paragraph_lines
    })
