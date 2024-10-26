import os
import logging

def init_folders(source, display_logging):
    folders = ['audio', 'video', 'caption', source]
    for folder in folders:
        os.makedirs(folder, exist_ok=True)
    if display_logging:
        logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    else:
        logging.disable(logging.CRITICAL)
    return source