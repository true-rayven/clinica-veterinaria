import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";

const DAYS = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

function toYMD(y, m, d) {
  return `${y}-${String(m+1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function PetModal({ pet, onClose }) {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [photo, setPhoto] = useState(localStorage.getItem(`pet_photo_${pet.pet_id}`) || null);

  useEffect(() => {
    axios.get("/api/appointments")
      .then(r => setAppts(r.data.filter(a => a.pet_id === pet.pet_id)))
      .finally(() => setLoading(false));
  }, [pet.pet_id]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      localStorage.setItem(`pet_photo_${pet.pet_id}`, reader.result);
      setPhoto(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{
      position:"fixed", top:0, left:0, right:0, bottom:0,
      background:"rgba(0,0,0,0.6)", display:"flex",
      alignItems:"center", justifyContent:"center", zIndex:1000
    }} onClick={onClose}>
      <div className="card" style={{ width:480, margin:0, maxHeight:"80vh", overflowY:"auto" }}
        onClick={e => e.stopPropagation()}>
        <div className="flex-between" style={{ marginBottom:16 }}>
          <div className="card-title" style={{ margin:0 }}>Pet Profile</div>
          <button className="btn btn-outline btn-sm" onClick={onClose}>✕ Close</button>
        </div>

        <div style={{ textAlign:"center", marginBottom:20 }}>
          {photo ? (
            <img src={photo} alt={pet.pet_name}
              style={{ width:90, height:90, borderRadius:"50%", objectFit:"cover",
                border:"3px solid var(--crimson)", marginBottom:10 }}/>
          ) : (
            <div style={{ width:90, height:90, borderRadius:"50%", background:"var(--mid-gray)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:36, margin:"0 auto 10px" }}>🐾</div>
          )}
          <div style={{ fontSize:18, fontWeight:700, color:"var(--charcoal)" }}>{pet.pet_name}</div>
          <div className="text-muted">{pet.type} · {pet.breed}</div>

          <label style={{
            display:"inline-block", marginTop:10, padding:"5px 14px",
            borderRadius:"var(--radius)", border:"1.5px solid var(--crimson)",
            color:"var(--crimson)", fontSize:12, fontWeight:600,
            cursor:"pointer", background:"transparent"
          }}>
            📷 {photo ? "Change Photo" : "Upload Photo"}
            <input type="file" accept="image/*" style={{ display:"none" }}
              onChange={handlePhotoUpload}/>
          </label>
        </div>

        <div className="divider"/>

        {[
          ["Name", pet.pet_name],
          ["Type", pet.type || "—"],
          ["Breed", pet.breed || "—"],
          ["Status", pet.registered_in_clinic ? "Registered ✓" : "Unregistered"],
        ].map(([k,v]) => (
          <div key={k} className="flex-between" style={{ padding:"8px 0", borderBottom:"1px solid var(--mid-gray)", fontSize:13 }}>
            <span style={{ color:"var(--muted)" }}>{k}</span>
            <strong style={{ color: k==="Status" && pet.registered_in_clinic ? "var(--green)" : "var(--charcoal)" }}>{v}</strong>
          </div>
        ))}

        <div className="divider"/>
        <div className="card-title">Appointment History</div>
        {loading ? <div className="spinner"/> : appts.length === 0
          ? <p className="text-muted">No appointments yet.</p>
          : appts.map(a => (
            <div key={a.appointment_id} className="flex-between" style={{
              padding:"10px 0", borderBottom:"1px solid var(--mid-gray)", fontSize:13
            }}>
              <div>
                <strong>{a.appt_date} at {a.appt_time}</strong>
                <div className="text-muted">{a.services || "No services"} · {a.reason_for_visit || "—"}</div>
              </div>
              <span className={`badge badge-${a.status}`}>{a.status}</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}

export function CalendarPage() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [selected, setSelected] = useState(null);
  const [slots, setSlots] = useState([]);
  const [blackout, setBlackout] = useState(false);
  const [blackouts, setBlackouts] = useState([]);
  const [booked, setBooked] = useState({});
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    axios.get("/api/blackouts").then(r => setBlackouts(r.data.map(b => b.blackout_date)));
  }, []);

  const selectDay = async (d) => {
    const dateStr = toYMD(year, month, d);
    setSelected(dateStr);
    const r = await axios.get(`/api/appointments/available?date=${dateStr}`);
    setBlackout(r.data.blackout);
    setSlots(r.data.slots || []);
  };

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y=>y-1); } else setMonth(m=>m-1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y=>y+1); } else setMonth(m=>m+1); };

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  const todayStr = toYMD(now.getFullYear(), now.getMonth(), now.getDate());

  const getDayClass = (d) => {
    const ds = toYMD(year, month, d);
    if (ds === selected) return "cal-day selected";
    if (blackouts.includes(ds)) return "cal-day closed";
    if (ds < todayStr) return "cal-day closed";
    if (ds === todayStr) return "cal-day available today";
    return "cal-day available";
  };

  return (
    <div>
      <div className="page-header">
        <h1>Appointment Calendar</h1>
        <p>Select a date to view available slots. Green = open, Red = full, Gray = closed (R23, R24)</p>
      </div>
      <div className="two-col">
        <div className="card">
          <div className="flex-between" style={{ marginBottom:12 }}>
            <button className="btn btn-outline btn-sm" onClick={prevMonth}>◀</button>
            <strong style={{ fontSize:16 }}>{MONTHS[month]} {year}</strong>
            <button className="btn btn-outline btn-sm" onClick={nextMonth}>▶</button>
          </div>
          <div className="cal-grid">
            {DAYS.map(d => <div key={d} className="cal-day-header">{d}</div>)}
            {Array(firstDay).fill(null).map((_,i) => <div key={"e"+i} className="cal-day empty"/>)}
            {Array(daysInMonth).fill(null).map((_,i) => (
              <div key={i+1} className={getDayClass(i+1)} onClick={() => selectDay(i+1)}>
                {i+1}
              </div>
            ))}
          </div>
          <div className="flex-gap" style={{ marginTop:14 }}>
            {[["available","#E8F5E9","#2E7D32","Open"],["full","#FFEBEE","#C62828","Full"],["closed","#F5F0F0","#9E8E8E","Closed"]].map(([,bg,c,l]) => (
              <div key={l} style={{ display:"flex", alignItems:"center", gap:6, fontSize:12, color:"var(--muted)" }}>
                <div style={{ width:12, height:12, borderRadius:3, background:bg, border:`1px solid ${c}` }}/>
                {l}
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">
            {selected ? `Slots for ${selected}` : "Select a date"}
          </div>
          {!selected && <p className="text-muted">Click a date on the calendar to see available time slots.</p>}
          {selected && blackout && (
            <div className="alert alert-error">This date is a blackout / clinic holiday. No appointments available.</div>
          )}
          {selected && !blackout && slots.map(sl => (
            <div key={sl.time} className="flex-between" style={{
              padding:"10px 14px", borderRadius:"var(--radius)",
              border:`1px solid ${sl.available?"#A5D6A7":"#EF9A9A"}`,
              background: sl.available?"var(--green-light)":"var(--red-light)",
              marginBottom:8
            }}>
              <strong style={{ fontSize:14 }}>{sl.time}</strong>
              {sl.available
                ? (user?.role !== "admin"
                    ? <button className="btn btn-success btn-sm"
                        onClick={() => navigate(`/book?date=${selected}&time=${sl.time}`)}>Book</button>
                    : <span className="badge badge-confirmed">Open</span>)
                : <span className="badge badge-cancelled">Booked</span>
              }
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function BookAppointment() {
  const [step, setStep] = useState(1);
  const [pets, setPets] = useState([]);
  const [services, setServices] = useState([]);
  const [blackouts, setBlackouts] = useState([]);
  const [dateError, setDateError] = useState("");
  const [form, setForm] = useState({
    pet_id:"", appt_date:"", appt_time:"", reason_for_visit:"",
    notif_preference:"email", service_ids:[]
  });
  const [newPet, setNewPet] = useState({ pet_name:"", type:"", breed:"" });
  const [petPhotoPreview, setPetPhotoPreview] = useState(null);
  const [petPhotoBase64, setPetPhotoBase64] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const params = new URLSearchParams(window.location.search);
  const prefDate = params.get("date") || "";
  const prefTime = params.get("time") || "";

  useEffect(() => {
    axios.get("/api/pets").then(r => setPets(r.data));
    axios.get("/api/services").then(r => setServices(r.data));
    axios.get("/api/blackouts").then(r => setBlackouts(r.data.map(b => b.blackout_date)));
    if (prefDate) setForm(f => ({...f, appt_date:prefDate}));
    if (prefTime) setForm(f => ({...f, appt_time:prefTime}));
  }, []);

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setPetPhotoPreview(reader.result);
      setPetPhotoBase64(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const addPet = async () => {
    if (!newPet.pet_name) return;
    const r = await axios.post("/api/pets", newPet);
    const newPetId = r.data.pet_id;
    if (petPhotoBase64) {
      localStorage.setItem(`pet_photo_${newPetId}`, petPhotoBase64);
    }
    const updated = await axios.get("/api/pets");
    setPets(updated.data);
    setForm(f => ({...f, pet_id: newPetId}));
    setNewPet({ pet_name:"", type:"", breed:"" });
    setPetPhotoPreview(null);
    setPetPhotoBase64(null);
  };

  const toggleService = id => {
    setForm(f => ({
      ...f,
      service_ids: f.service_ids.includes(id)
        ? f.service_ids.filter(s => s!==id)
        : [...f.service_ids, id]
    }));
  };

  const submit = async () => {
    setError(""); setSuccess(""); setLoading(true);
    try {
      await axios.post("/api/appointments", form);
      setSuccess("Appointment booked! A confirmation will be sent to you. (R15)");
      setTimeout(() => navigate("/my-appointments"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Booking failed");
    } finally { setLoading(false); }
  };

  const selectedPet = pets.find(p => p.pet_id == form.pet_id);
  const selectedPetPhoto = selectedPet ? localStorage.getItem(`pet_photo_${selectedPet.pet_id}`) : null;

  const STEPS = ["Your Pet","Services","Date & Time","Confirm"];

  return (
    <div>
      <div className="page-header">
        <h1>Book an Appointment</h1>
        <p>Complete the steps below to schedule your visit (R19, R20)</p>
      </div>
      <div className="two-col">
        <div className="card">
          <div className="steps">
            {STEPS.map((st,i) => (
              <div key={i} style={{ display:"flex", alignItems:"center", flex: i<STEPS.length-1?"1":"0" }}>
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center" }}>
                  <div className={`step-dot ${i+1<step?"done":i+1===step?"active":""}`}>
                    {i+1<step?"✓":i+1}
                  </div>
                  <span style={{ fontSize:10,color:"var(--muted)",marginTop:3,whiteSpace:"nowrap" }}>{st}</span>
                </div>
                {i<STEPS.length-1 && <div className={`step-line ${i+1<step?"done":""}`} style={{ marginBottom:16 }}/>}
              </div>
            ))}
          </div>
          {error   && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          {step === 1 && (
            <div>
              <div className="form-group">
                <label className="form-label">Select Your Pet</label>
                <select className="form-select" value={form.pet_id}
                  onChange={e => setForm(f=>({...f,pet_id:e.target.value}))}>
                  <option value="">-- Choose a pet --</option>
                  {pets.map(p => (
                    <option key={p.pet_id} value={p.pet_id}>{p.pet_name} ({p.breed})</option>
                  ))}
                </select>
              </div>
              {selectedPetPhoto && (
                <div style={{ marginBottom:16, textAlign:"center" }}>
                  <img src={selectedPetPhoto} alt="Pet"
                    style={{ width:80, height:80, borderRadius:"50%", objectFit:"cover",
                      border:"3px solid var(--crimson)" }}/>
                  <div className="text-muted" style={{ marginTop:4 }}>{selectedPet?.pet_name}</div>
                </div>
              )}
              <div className="divider"/>
              <p className="text-muted" style={{ marginBottom:10 }}>Or add a new pet:</p>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Pet Name</label>
                  <input className="form-input" value={newPet.pet_name}
                    onChange={e=>setNewPet(n=>({...n,pet_name:e.target.value}))} placeholder="Bella"/>
                </div>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <input className="form-input" value={newPet.type}
                    onChange={e=>setNewPet(n=>({...n,type:e.target.value}))} placeholder="Dog / Cat"/>
                </div>
                <div className="form-group" style={{ gridColumn:"1/-1" }}>
                  <label className="form-label">Breed</label>
                  <input className="form-input" value={newPet.breed}
                    onChange={e=>setNewPet(n=>({...n,breed:e.target.value}))} placeholder="Golden Retriever"/>
                </div>
                <div className="form-group" style={{ gridColumn:"1/-1" }}>
                  <label className="form-label">Pet Photo (optional)</label>
                  <input type="file" accept="image/*" className="form-input"
                    style={{ padding:"6px 12px", cursor:"pointer" }}
                    onChange={handlePhotoChange}/>
                  {petPhotoPreview && (
                    <div style={{ marginTop:10, display:"flex", alignItems:"center", gap:12 }}>
                      <img src={petPhotoPreview} alt="Preview"
                        style={{ width:64, height:64, borderRadius:"50%", objectFit:"cover",
                          border:"3px solid var(--crimson)" }}/>
                      <span className="text-muted">Photo preview</span>
                    </div>
                  )}
                </div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={addPet}>+ Add Pet</button>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="text-muted" style={{ marginBottom:12 }}>Select one or more services (R20):</p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {services.map(sv => (
                  <div key={sv.service_id}
                    className={`service-card ${form.service_ids.includes(sv.service_id)?"selected":""}`}
                    onClick={() => toggleService(sv.service_id)}
                    style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"12px 16px", textAlign:"left" }}>
                    <div style={{ flex:1 }}>
                      <div className="service-card-name" style={{ fontSize:13, marginBottom:3 }}>{sv.service_name}</div>
                      <div style={{ fontSize:11, color:"var(--muted)", lineHeight:1.4 }}>{sv.description}</div>
                    </div>
                    <div className="service-card-price" style={{ fontWeight:700, color:"var(--crimson)", marginLeft:12, whiteSpace:"nowrap" }}>₱{Number(sv.price).toLocaleString()}</div>
                  </div>
                ))}
              </div>
              {form.service_ids.length > 0 && (
                <div className="alert alert-success" style={{ marginTop:12 }}>
                  {form.service_ids.length} service{form.service_ids.length>1?"s":""} selected
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Preferred Date *</label>
                <input className="form-input" type="date" value={form.appt_date}
                  min={new Date().toISOString().split("T")[0]}
                  onChange={e => {
                    const val = e.target.value;
                    setForm(f => ({...f, appt_date: val}));
                    if (blackouts.includes(val)) {
                      setDateError("⚠️ This date is a clinic holiday / blackout date. Please choose another.");
                    } else {
                      setDateError("");
                    }
                  }} required/>
                {dateError && <div className="alert alert-error" style={{ marginTop:8 }}>{dateError}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Preferred Time *</label>
                <select className="form-select" value={form.appt_time}
                  onChange={e=>setForm(f=>({...f,appt_time:e.target.value}))}>
                  <option value="">-- Select time --</option>
                  {["09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00"].map(t =>
                    <option key={t} value={t}>{t}</option>
                  )}
                </select>
              </div>
              <div className="form-group" style={{ gridColumn:"1/-1" }}>
                <label className="form-label">Reason for Visit</label>
                <textarea className="form-textarea" value={form.reason_for_visit}
                  onChange={e=>setForm(f=>({...f,reason_for_visit:e.target.value}))}
                  placeholder="e.g. Annual check-up and vaccination"/>
              </div>
              <div className="form-group" style={{ gridColumn:"1/-1" }}>
                <div className="alert alert-info" style={{ display:"flex", alignItems:"center", gap:10 }}>
                  <span style={{ fontSize:20 }}>📧</span>
                  <span>A confirmation email will be sent to you once your appointment is booked. Please wait for it in your inbox. (R15)</span>
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="alert alert-info" style={{ marginBottom:16 }}>
                Please review your booking details before confirming.
              </div>
              {selectedPetPhoto && (
                <div style={{ textAlign:"center", marginBottom:16 }}>
                  <img src={selectedPetPhoto} alt="Pet"
                    style={{ width:72, height:72, borderRadius:"50%", objectFit:"cover",
                      border:"3px solid var(--crimson)" }}/>
                  <div className="text-muted" style={{ marginTop:4 }}>{selectedPet?.pet_name}</div>
                </div>
              )}
              {[
                ["Pet", selectedPet?.pet_name || "—"],
                ["Date", form.appt_date || "—"],
                ["Time", form.appt_time || "—"],
                ["Services", services.filter(s=>form.service_ids.includes(s.service_id)).map(s=>s.service_name).join(", ") || "None"],
                ["Reason", form.reason_for_visit || "—"],
              ].map(([k,v]) => (
                <div key={k} className="flex-between" style={{ padding:"10px 0", borderBottom:"1px solid var(--mid-gray)", fontSize:13 }}>
                  <span style={{ color:"var(--muted)" }}>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
              <div className="alert alert-warning" style={{ marginTop:16 }}>
                Cancellations must be made at least 24 hours before the appointment (R21).
              </div>
            </div>
          )}

          <div className="flex-gap" style={{ justifyContent:"flex-end", marginTop:20 }}>
            {step > 1 && <button className="btn btn-outline" onClick={()=>setStep(s=>s-1)}>← Back</button>}
            {step < 4
              ? <button className="btn btn-primary" onClick={()=>setStep(s=>s+1)}
                  disabled={
                    (step===1 && !form.pet_id) ||
                    (step===3 && (!!dateError || !form.appt_date || !form.appt_time))
                  }>Continue →</button>
              : <button className="btn btn-primary" onClick={submit} disabled={loading}>
                  {loading ? "Booking…" : "Confirm Booking"}
                </button>
            }
          </div>
        </div>

        <div className="card" style={{ height:"fit-content" }}>
          <div className="card-title">Booking Summary</div>
          {selectedPetPhoto && (
            <div style={{ textAlign:"center", marginBottom:12 }}>
              <img src={selectedPetPhoto} alt="Pet"
                style={{ width:56, height:56, borderRadius:"50%", objectFit:"cover",
                  border:"2px solid var(--crimson)" }}/>
            </div>
          )}
          {[
            ["Pet", selectedPet?.pet_name || "—"],
            ["Date", form.appt_date || "—"],
            ["Time", form.appt_time || "—"],
            ["Services", `${form.service_ids.length} selected`],
          ].map(([k,v]) => (
            <div key={k} className="flex-between" style={{ padding:"8px 0", borderBottom:"1px solid var(--mid-gray)", fontSize:13 }}>
              <span style={{ color:"var(--muted)" }}>{k}</span>
              <strong>{v}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MyAppointments() {
  const [appts, setAppts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reschedule, setReschedule] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [msg, setMsg] = useState("");

  const load = () => {
    axios.get("/api/appointments").then(r => setAppts(r.data)).finally(()=>setLoading(false));
  };
  useEffect(load, []);

  const cancel = async id => {
    if (!window.confirm("Cancel this appointment?")) return;
    try {
      await axios.patch(`/api/appointments/${id}/cancel`);
      load();
    } catch (err) { alert(err.response?.data?.message || "Cannot cancel"); }
  };

  const doReschedule = async () => {
    try {
      await axios.patch(`/api/appointments/${reschedule}/reschedule`, {
        appt_date: newDate, appt_time: newTime
      });
      setMsg("Appointment rescheduled!");
      setReschedule(null);
      load();
    } catch (err) { alert(err.response?.data?.message || "Cannot reschedule"); }
  };

  if (loading) return <div className="spinner"/>;

  return (
    <div>
      <div className="page-header">
        <h1>My Appointments</h1>
        <p>View and manage your appointment history (R5, R21)</p>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}
      {reschedule && (
        <div style={{
          position:"fixed", top:0, left:0, right:0, bottom:0,
          background:"rgba(0,0,0,0.5)", display:"flex",
          alignItems:"center", justifyContent:"center", zIndex:999
        }}>
          <div className="card" style={{ width:400, margin:0 }}>
            <div className="card-title">Reschedule Appointment</div>
            <div className="form-group">
              <label className="form-label">New Date</label>
              <input className="form-input" type="date" value={newDate}
                onChange={e=>setNewDate(e.target.value)}/>
            </div>
            <div className="form-group">
              <label className="form-label">New Time</label>
              <select className="form-select" value={newTime}
                onChange={e=>setNewTime(e.target.value)}>
                <option value="">-- Select time --</option>
                {["09:00","10:00","11:00","13:00","14:00","15:00","16:00","17:00"].map(t =>
                  <option key={t} value={t}>{t}</option>
                )}
              </select>
            </div>
            <div className="flex-gap">
              <button className="btn btn-primary" onClick={doReschedule}>Confirm</button>
              <button className="btn btn-outline" onClick={()=>setReschedule(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Date</th><th>Time</th><th>Pet</th><th>Services</th><th>Reason</th><th>Status</th><th>Action</th></tr>
            </thead>
            <tbody>
              {appts.length === 0 && (
                <tr><td colSpan={7} className="text-center text-muted" style={{ padding:24 }}>No appointments found</td></tr>
              )}
              {appts.map(a => (
                <tr key={a.appointment_id}>
                  <td>{a.appt_date}</td>
                  <td>{a.appt_time}</td>
                  <td>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      {localStorage.getItem(`pet_photo_${a.pet_id}`) && (
                        <img src={localStorage.getItem(`pet_photo_${a.pet_id}`)} alt=""
                          style={{ width:28, height:28, borderRadius:"50%", objectFit:"cover" }}/>
                      )}
                      {a.pet_name} <span className="text-muted">({a.breed})</span>
                    </div>
                  </td>
                  <td style={{ fontSize:12 }}>{a.services || "—"}</td>
                  <td style={{ fontSize:12 }}>{a.reason_for_visit || "—"}</td>
                  <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                  <td>
                    <div className="flex-gap">
                      {(a.status==="pending"||a.status==="confirmed") && (
                        <>
                          <button className="btn btn-outline btn-sm"
                            onClick={()=>{ setReschedule(a.appointment_id); setNewDate(""); setNewTime(""); }}>
                            Reschedule
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={()=>cancel(a.appointment_id)}>
                            Cancel
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function ClientRecords() {
  const [clients, setClients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [pets, setPets] = useState({});
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    axios.get("/api/clients").then(r => setClients(r.data)).finally(()=>setLoading(false));
  }, []);

  const loadPets = async (client_id) => {
    if (expanded === client_id) { setExpanded(null); return; }
    setExpanded(client_id);
    if (!pets[client_id]) {
      const r = await axios.get("/api/pets");
      const clientPets = r.data.filter(p => p.client_id === client_id);
      setPets(prev => ({...prev, [client_id]: clientPets}));
    }
  };

  const registerPet = async (pet_id, client_id) => {
    await axios.patch(`/api/pets/${pet_id}/register`);
    const r = await axios.get("/api/pets");
    const clientPets = r.data.filter(p => p.client_id === client_id);
    setPets(prev => ({...prev, [client_id]: clientPets}));
  };

  const filtered = clients.filter(c =>
    c.full_name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase()) ||
    (c.phone_number || "").includes(search)
  );

  if (loading) return <div className="spinner"/>;

  return (
    <div>
      {selectedPet && <PetModal pet={selectedPet} onClose={() => setSelectedPet(null)}/>}
      <div className="page-header">
        <h1>Client Records</h1>
        <p>Admin-only view — manage all client accounts (R3, R4, R27)</p>
      </div>
      <div className="card">
        <div className="flex-gap" style={{ marginBottom:16 }}>
          <input className="form-input" style={{ maxWidth:360 }}
            placeholder="Search by name, email, phone…"
            value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Name</th><th>Email</th><th>Phone</th><th>Address</th><th>Joined</th><th>Pets</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="text-center text-muted" style={{ padding:24 }}>No clients found</td></tr>
              )}
              {filtered.map(c => (
                <>
                  <tr key={c.client_id}>
                    <td><strong>{c.full_name}</strong></td>
                    <td>{c.email}</td>
                    <td>{c.phone_number}</td>
                    <td style={{ fontSize:12 }}>{c.address || "—"}</td>
                    <td style={{ fontSize:12, color:"var(--muted)" }}>{c.created_at?.split("T")[0]}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => loadPets(c.client_id)}>
                        {expanded === c.client_id ? "Hide Pets ▲" : "View Pets ▼"}
                      </button>
                    </td>
                  </tr>
                  {expanded === c.client_id && (
                    <tr key={`pets-${c.client_id}`}>
                      <td colSpan={6} style={{ background:"var(--bg)", padding:"12px 20px" }}>
                        {!pets[c.client_id] || pets[c.client_id].length === 0
                          ? <p className="text-muted">No pets registered yet.</p>
                          : pets[c.client_id].map(p => (
                            <div key={p.pet_id} className="flex-between" style={{
                              padding:"10px 0", borderBottom:"1px solid var(--mid-gray)"
                            }}>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                {localStorage.getItem(`pet_photo_${p.pet_id}`) && (
                                  <img src={localStorage.getItem(`pet_photo_${p.pet_id}`)} alt=""
                                    style={{ width:36, height:36, borderRadius:"50%", objectFit:"cover" }}/>
                                )}
                                <div>
                                  <strong style={{ cursor:"pointer", color:"var(--crimson)" }}
                                    onClick={() => setSelectedPet(p)}>{p.pet_name}</strong>
                                  <span className="text-muted"> · {p.type} · {p.breed}</span>
                                </div>
                              </div>
                              <div className="flex-gap">
                                <button className="btn btn-outline btn-sm"
                                  onClick={() => setSelectedPet(p)}>View Profile</button>
                                <span className={`badge ${p.registered_in_clinic?"badge-confirmed":"badge-pending"}`}>
                                  {p.registered_in_clinic ? "Registered" : "Unregistered"}
                                </span>
                                {!p.registered_in_clinic && (
                                  <button className="btn btn-success btn-sm"
                                    onClick={() => registerPet(p.pet_id, c.client_id)}>
                                    Register Pet
                                  </button>
                                )}
                              </div>
                            </div>
                          ))
                        }
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function Notifications() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/api/notifications").then(r => setNotifs(r.data)).finally(()=>setLoading(false));
  }, []);

  const iconMap = { confirmation:"✓", cancellation:"✕", reminder:"!", update:"↺" };
  const colorMap = { confirmation:"green", cancellation:"red", reminder:"amber", update:"amber" };

  if (loading) return <div className="spinner"/>;

  return (
    <div>
      <div className="page-header">
        <h1>Notifications</h1>
        <p>System alerts and automated reminders (R15–R18)</p>
      </div>
      <div className="card">
        {notifs.length === 0 && <p className="text-muted text-center" style={{ padding:24 }}>No notifications yet</p>}
        {notifs.map(n => (
          <div key={n.notif_id} className="notif-item">
            <div className={`notif-icon ${colorMap[n.type]||"green"}`}>
              {iconMap[n.type] || "•"}
            </div>
            <div style={{ flex:1 }}>
              <div className="notif-title">{n.type?.charAt(0).toUpperCase()+n.type?.slice(1)} — {n.full_name || "Client"}</div>
              <div className="notif-desc">{n.message}</div>
            </div>
            <div className="notif-time">{n.sent_at?.split("T")[0]}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Profile() {
  const [profile, setProfile] = useState({});
  const [pets, setPets] = useState([]);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [msg, setMsg] = useState("");
  const [selectedPet, setSelectedPet] = useState(null);

  useEffect(() => {
    axios.get("/api/clients/me").then(r => { setProfile(r.data); setForm(r.data); });
    axios.get("/api/pets").then(r => setPets(r.data));
  }, []);

  const save = async () => {
    await axios.put("/api/clients/me", form);
    setProfile(form); setEditing(false);
    setMsg("Profile updated!");
    setTimeout(()=>setMsg(""), 3000);
  };

  return (
    <div>
      {selectedPet && <PetModal pet={selectedPet} onClose={() => setSelectedPet(null)}/>}
      <div className="page-header">
        <h1>My Profile</h1>
        <p>View and manage your account information (R6, R27)</p>
      </div>
      {msg && <div className="alert alert-success">{msg}</div>}
      <div className="two-col">
        <div className="card">
          <div style={{ textAlign:"center", marginBottom:20 }}>
            <div className="avatar" style={{ width:64,height:64,fontSize:24,margin:"0 auto 12px" }}>
              {profile.full_name?.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase()}
            </div>
            <strong style={{ fontSize:18 }}>{profile.full_name}</strong>
            <div className="text-muted">Client Account</div>
          </div>
          <div className="divider"/>
          {editing ? (
            <div className="form-grid">
              <div className="form-group" style={{ gridColumn:"1/-1" }}>
                <label className="form-label">Full Name</label>
                <input className="form-input" value={form.full_name||""}
                  onChange={e=>setForm(f=>({...f,full_name:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input className="form-input" value={form.phone_number||""}
                  onChange={e=>setForm(f=>({...f,phone_number:e.target.value}))}/>
              </div>
              <div className="form-group">
                <label className="form-label">Address</label>
                <input className="form-input" value={form.address||""}
                  onChange={e=>setForm(f=>({...f,address:e.target.value}))}/>
              </div>
              <div className="flex-gap" style={{ gridColumn:"1/-1" }}>
                <button className="btn btn-primary" onClick={save}>Save</button>
                <button className="btn btn-outline" onClick={()=>setEditing(false)}>Cancel</button>
              </div>
            </div>
          ) : (
            <>
              {[["Email",profile.email],["Phone",profile.phone_number],["DOB",profile.date_of_birth],["Address",profile.address]].map(([k,v])=>(
                <div key={k} className="flex-between" style={{ padding:"10px 0", borderBottom:"1px solid var(--mid-gray)", fontSize:13 }}>
                  <span style={{ color:"var(--muted)" }}>{k}</span><strong>{v||"—"}</strong>
                </div>
              ))}
              <button className="btn btn-primary" style={{ marginTop:16,width:"100%",justifyContent:"center" }}
                onClick={()=>setEditing(true)}>Edit Profile</button>
            </>
          )}
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          <div className="card">
            <div className="card-title">My Pets (R7)</div>
            {pets.length === 0 && <p className="text-muted">No pets registered yet. Add a pet when booking.</p>}
            {pets.map(p => (
              <div key={p.pet_id} className="flex-between" style={{ padding:"10px 0", borderBottom:"1px solid var(--mid-gray)" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                  {localStorage.getItem(`pet_photo_${p.pet_id}`) ? (
                    <img src={localStorage.getItem(`pet_photo_${p.pet_id}`)} alt=""
                      style={{ width:40, height:40, borderRadius:"50%", objectFit:"cover",
                        border:"2px solid var(--crimson)", cursor:"pointer" }}
                      onClick={() => setSelectedPet(p)}/>
                  ) : (
                    <div style={{ width:40, height:40, borderRadius:"50%", background:"var(--mid-gray)",
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:18, cursor:"pointer" }}
                      onClick={() => setSelectedPet(p)}>🐾</div>
                  )}
                  <div>
                    <strong style={{ cursor:"pointer", color:"var(--crimson)" }}
                      onClick={() => setSelectedPet(p)}>{p.pet_name}</strong>
                    <div className="text-muted">{p.type} · {p.breed}</div>
                  </div>
                </div>
                <div className="flex-gap">
                  <button className="btn btn-outline btn-sm" onClick={() => setSelectedPet(p)}>View</button>
                  <span className={`badge ${p.registered_in_clinic?"badge-confirmed":"badge-pending"}`}>
                    {p.registered_in_clinic?"Registered":"Unregistered"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Report() {
  const [rows, setRows] = useState([]);
  const [month, setMonth] = useState(String(new Date().getMonth()+1).padStart(2,"0"));
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    const r = await axios.get(`/api/report?month=${month}&year=${year}`);
    setRows(r.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const totals = {
    confirmed: rows.filter(r=>r.status==="confirmed").length,
    pending:   rows.filter(r=>r.status==="pending").length,
    cancelled: rows.filter(r=>r.status==="cancelled").length,
  };

  return (
    <div>
      <div className="page-header">
        <h1>Schedule Report</h1>
        <p>Admin-only printable schedule report (R4, R25)</p>
      </div>
      <div className="card">
        <div className="flex-gap" style={{ marginBottom:16 }}>
          <select className="form-select" style={{ width:140 }} value={month} onChange={e=>setMonth(e.target.value)}>
            {MONTHS.map((m,i) => <option key={i} value={String(i+1).padStart(2,"0")}>{m}</option>)}
          </select>
          <input className="form-input" style={{ width:100 }} type="number" value={year}
            onChange={e=>setYear(e.target.value)} min={2024} max={2030}/>
          <button className="btn btn-primary" onClick={load}>Filter</button>
          <button className="btn btn-outline" onClick={()=>window.print()}>Print Report</button>
        </div>
        <div className="flex-gap" style={{ marginBottom:16 }}>
          <div style={{ padding:"8px 14px",borderRadius:"var(--radius)",background:"var(--green-light)",color:"var(--green)",fontWeight:700,fontSize:13 }}>
            Confirmed: {totals.confirmed}
          </div>
          <div style={{ padding:"8px 14px",borderRadius:"var(--radius)",background:"var(--amber-light)",color:"var(--amber)",fontWeight:700,fontSize:13 }}>
            Pending: {totals.pending}
          </div>
          <div style={{ padding:"8px 14px",borderRadius:"var(--radius)",background:"var(--red-light)",color:"#C62828",fontWeight:700,fontSize:13 }}>
            Cancelled: {totals.cancelled}
          </div>
          <div style={{ padding:"8px 14px",borderRadius:"var(--radius)",background:"var(--bg)",fontWeight:700,fontSize:13 }}>
            Total: {rows.length}
          </div>
        </div>
        {loading ? <div className="spinner"/> : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Date</th><th>Time</th><th>Client</th><th>Pet / Breed</th><th>Services</th><th>Reason</th><th>Status</th></tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr><td colSpan={7} className="text-center text-muted" style={{ padding:24 }}>No appointments found</td></tr>
                )}
                {rows.map(r => (
                  <tr key={r.appointment_id}>
                    <td>{r.appt_date}</td>
                    <td>{r.appt_time}</td>
                    <td><strong>{r.client_name}</strong></td>
                    <td>{r.pet_name} <span className="text-muted">({r.breed})</span></td>
                    <td style={{ fontSize:12 }}>{r.services||"—"}</td>
                    <td style={{ fontSize:12 }}>{r.reason_for_visit||"—"}</td>
                    <td><span className={`badge badge-${r.status}`}>{r.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export function ClientHome() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [appts, setAppts] = useState([]);

  useEffect(() => {
    axios.get("/api/appointments").then(r => setAppts(r.data));
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1>Welcome, {user?.name?.split(" ")[0]}! 🐾</h1>
        <p>Manage your pet appointments at Clinica Veterinaria de Figura</p>
      </div>
      <div className="stats-grid" style={{ gridTemplateColumns:"repeat(3,1fr)" }}>
        <div className="stat-card" style={{ cursor:"pointer" }} onClick={()=>navigate("/book")}>
          <div className="stat-label">Book Appointment</div>
          <div className="stat-value" style={{ fontSize:22 }}>+ New</div>
        </div>
        <div className="stat-card green" style={{ cursor:"pointer" }} onClick={()=>navigate("/calendar")}>
          <div className="stat-label">View Calendar</div>
          <div className="stat-value" style={{ display:"flex", alignItems:"center" }}>
            <Calendar size={32}/>
          </div>
        </div>
        <div className="stat-card amber" style={{ cursor:"pointer" }} onClick={()=>navigate("/my-appointments")}>
          <div className="stat-label">My Appointments</div>
          <div className="stat-value">{appts.length}</div>
        </div>
      </div>
      <div className="card" style={{ marginTop:0 }}>
        <div className="card-title">Recent Appointments</div>
        {appts.length === 0
          ? <p className="text-muted">No appointments yet. <span className="auth-link" onClick={()=>navigate("/book")}>Book your first one!</span></p>
          : appts.map(a => (
            <div key={a.appointment_id} className="flex-between" style={{ padding:"12px 0", borderBottom:"1px solid var(--mid-gray)" }}>
              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                {localStorage.getItem(`pet_photo_${a.pet_id}`) && (
                  <img src={localStorage.getItem(`pet_photo_${a.pet_id}`)} alt=""
                    style={{ width:32, height:32, borderRadius:"50%", objectFit:"cover" }}/>
                )}
                <div>
                  <strong>{a.appt_date} at {a.appt_time}</strong>
                  <div className="text-muted">{a.pet_name} · {a.services || "No services"}</div>
                </div>
              </div>
              <div className="flex-gap">
                <span className={`badge badge-${a.status}`}>{a.status}</span>
                <button className="btn btn-outline btn-sm" onClick={()=>navigate("/my-appointments")}>
                  Manage →
                </button>
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}