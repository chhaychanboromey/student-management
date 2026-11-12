# Student Management System (Microservices + Docker + Kubernetes)

```
Postman ──> api-gateway-service (NodePort 30080)
              │
   ┌──────────┴─────────────── POD 1 ───────────┐
   │  api-gateway :3000 ──localhost──> registration-service :4001 │
   └──────────┬──────────────────────────────────┘
              │ http://student-service:4002 (ClusterIP Service)
   ┌──────────┴──────── POD 2 ─────┐
   │  student-service :4002        │
   └───────────────────────────────┘
        both services ──> MongoDB Atlas (database: studentdb, collection: students)
```

Database fields: `Student_id, Student_name, student_mobile, student_email, student_password`
(`Student_id` auto-increments; passwords are stored as bcrypt hashes.)

## 1. Set up MongoDB Atlas
1. Create a free cluster, a database user, and under *Network Access* allow `0.0.0.0/0`.
2. Copy the connection string and paste it into `k8s/00-secret.yaml` (`MONGO_URI`). Use `/studentdb` as the database name.

## 2. Build images inside Minikube
```bash
minikube start
eval $(minikube docker-env)          # Windows PowerShell: & minikube -p minikube docker-env | Invoke-Expression
docker build -t api-gateway:1.0          ./api-gateway
docker build -t registration-service:1.0 ./registration-service
docker build -t student-service:1.0      ./student-service
```

## 3. Deploy
```bash
kubectl apply -f k8s/00-secret.yaml
kubectl apply -f k8s/01-pod1-deployment.yaml
kubectl apply -f k8s/02-pod2-deployment.yaml
kubectl apply -f k8s/03-services.yaml
kubectl get pods,svc
```
Pod 1 should show `2/2 Running`, Pod 2 `1/1 Running`.

## 4. Get the URL
```bash
minikube service api-gateway-service --url
```
Use that URL as `BASE` below (on Windows/macOS with the Docker driver keep the terminal open).

## 5. Postman requests (all go through the gateway)

**Task 5 - Register** `POST {BASE}/api/register`
```json
{
  "Student_name": "Sophea Vathna",
  "student_mobile": "012345678",
  "student_email": "sophea@example.com",
  "student_password": "Pass@1234"
}
```
Register 2-3 students so the other calls have data.

**Task 6 - 2nd microservice (use the one assigned to you)**

| Option | Request | Body |
|---|---|---|
| Search | `GET {BASE}/api/students/search?id=1` or `?name=Sophea` | none |
| Login | `POST {BASE}/api/students/login` | `{"student_email":"sophea@example.com","student_password":"Pass@1234"}` |
| Update | `PUT {BASE}/api/students/1` | `{"student_mobile":"099888777"}` and/or `{"student_password":"NewPass@1"}` |
| Delete | `DELETE {BASE}/api/students/1` | none |

## 6. Screenshot checklist
| Task | What to capture |
|---|---|
| 1 | `api-gateway/server.js`, `registration-service/server.js`, `student-service/server.js` |
| 2 | The three `Dockerfile`s |
| 3 | `k8s/01-pod1-deployment.yaml` and `k8s/02-pod2-deployment.yaml` (plus `kubectl get pods`) |
| 4 | `k8s/03-services.yaml` (plus `kubectl get svc`) |
| 5 | Postman register request + Atlas *Browse Collections* showing the new document |
| 6 | Postman request for your 2nd-microservice option |

## 7. Push to GitHub (Task 7)
```bash
git init
git add .
git commit -m "Student management microservices"
git branch -M main
git remote add origin https://github.com/<your-username>/student-management.git
git push -u origin main
```
Before pushing, make sure `k8s/00-secret.yaml` still has the placeholder, not your real password.

## Troubleshooting
- `ErrImageNeverPull`: you built the images outside Minikube. Re-run `eval $(minikube docker-env)` and rebuild.
- `CrashLoopBackOff`: `kubectl logs <pod> -c registration-service`. Usually a wrong `MONGO_URI` or Atlas IP allowlist.
- Gateway returns 502 for `/api/students/...`: check `kubectl get svc student-service` and that Pod 2 is running.
