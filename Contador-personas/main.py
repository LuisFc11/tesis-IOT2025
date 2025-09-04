import cv2
import time
import os
from ultralytics import YOLO
from pymongo import MongoClient
from dotenv import load_dotenv

# 🔹 Cargar variables desde .env
load_dotenv()

MONGO_URI = os.getenv("MONGO_URI")
DB_NAME = os.getenv("DB_NAME")
COLLECTION_NAME = os.getenv("COLLECTION_NAME")
VIDEO_URL = os.getenv("VIDEO_URL")

# Conectar a Mongo
client = MongoClient(MONGO_URI)
db = client[DB_NAME]
coleccion = db[COLLECTION_NAME]

# 🔹 Modelo YOLO
model = YOLO("yolov8n.pt")

def contar_personas(video_path=VIDEO_URL, intervalo=10):
    cap = cv2.VideoCapture(video_path)

    if not cap.isOpened():
        print("❌ Error: No se pudo conectar a la cámara.")
        return

    ultimo_guardado = time.time()

    while True:
        ret, frame = cap.read()
        if not ret:
            print("❌ Error: No se pudo leer el video.")
            break

        results = model(frame)
        personas = [box for box in results[0].boxes if int(box.cls[0]) == 0]

        for box in personas:
            x1, y1, x2, y2 = box.xyxy[0]
            conf = box.conf[0]
            cv2.rectangle(frame, (int(x1), int(y1)), (int(x2), int(y2)), (0, 255, 0), 2)
            cv2.putText(frame, f"Persona {conf:.2f}", (int(x1), int(y1) - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 0), 2)

        total = len(personas)

        cv2.putText(frame, f"Total Personas: {total}", (20, 50),
                    cv2.FONT_HERSHEY_SIMPLEX, 1.2, (0, 0, 255), 3)

        if total > 25:
            cv2.putText(frame, "ALERTA: Exceso de personas!", (20, 100),
                        cv2.FONT_HERSHEY_SIMPLEX, 1, (0, 0, 255), 3)

        if time.time() - ultimo_guardado >= intervalo:
            data = {
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "personas": total
            }
            coleccion.insert_one(data)
            print(f"✅ Guardado en MongoDB: {data}")
            ultimo_guardado = time.time()

        cv2.imshow("Conteo de Personas - YOLOv8", frame)

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()

if __name__ == "__main__":
    contar_personas(intervalo=10)
