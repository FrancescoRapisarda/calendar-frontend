import { useEffect, useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';
import "../components/calendarWeek.css";

// Utility
import { getWeekDates } from '../utils/dateUtils';
// import { ActivityMap } from "../types/activityMap"; 
import { SpaceCounters } from "../types/spaceCounters";

// Immagini
import imgAugusto from "../assets/img/augusto-school.png";
import imgPrato from "../assets/img/prato-scontornato.png";
import imgDelete from "../assets/img/remove.png";
import imgArrow from "../assets/img/next.png";
import imgHead from "../assets/img/photos-head.png";
import imgAtivitadeEscolar from "../assets/img/atividade-escolar.png";
import imgSaveAtivitade from "../assets/img/floppy-disk.png";
import imgSalaGoogle from "../assets/img/google-meet.jpg";
import imgSalaVideo from "../assets/img/projector.jpg";
import imgAtelieCriativo from "../assets/img/atelie-criativo.jpg";
// import imgBrinquedoteca from "../assets/img/brinquedoteca.jpg";

// Costanti
// const API_URL = "http://localhost:4000/api/weeks";
const API_URL = "https://calendar-backend-r54r.onrender.com/api/weeks"
const CURRENT_YEAR = new Date().getFullYear();
const daysOfWeek = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'];
const timeSlots = ['07:20', '08:10', '09:00', '09:20', '10:10', '11:00', '13:10', '14:00', '14:50', '15:10', '16:00'];
const classes = [
  "PRE' I", "PRE' II", "1º ANO A", "1º ANO B", "1º ANO C", "1º ANO D", "1º ANO E",
  "2º ANO A", "2º ANO B", "2º ANO C", "2º ANO D", "2º ANO E",
  "3º ANO A", "3º ANO B", "3º ANO C", "3º ANO D", "3º ANO E",
  "4º ANO A", "4º ANO B", "4º ANO C", "4º ANO D", "4º ANO E",
  "5º ANO A", "5º ANO B", "5º ANO C", "5º ANO D", "5º ANO E"
];
const resources = ['TV', 'Chromebook', 'Projetor', 'Som'];

const spaceData = [
  { name: "Sala Google", icon: imgSalaGoogle },
  { name: "Sala de Video", icon: imgSalaVideo },
  { name: "Atelier Criativo", icon: imgAtelieCriativo },
  // { name: "Brinquedoteca", icon: imgBrinquedoteca },
] as const;


// TYPE
type Space = typeof spaceData[number]['name'];
const spaces: Space[] = spaceData.map(s => s.name);
const icons: Record<Space, string> = Object.fromEntries(spaceData.map(s => [s.name, s.icon])) as Record<Space, string>;


type UserRole = 'admin' | 'docente';
type Spazio = "Sala Google" | "Sala de Video" | "Atelier Criativo";
type Activity = { classe: string; risorse: string; spazio: Spazio};
type ActivityMap = {[slot: string]: Activity;};


function CalendarWeek() {
  const { weekOffset = '0' } = useParams();
  const numericOffset = parseInt(weekOffset);
  const navigate = useNavigate();
  const userRole: UserRole = 'docente';

  // useState
  const [activities, setActivities] = useState<ActivityMap>({} as ActivityMap);
  const [counters, setCounters] = useState<SpaceCounters>({} as SpaceCounters);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [formData, setFormData] = useState<Activity>({ classe:'', risorse:'', spazio:'Sala Google' });
  const [showModal, setShowModal] = useState(false);
  // stato alert
  const [alert, setAlert] = useState<{type: "success" | "danger" | "warning", message: string} | null>(null);

  // Caricamento dati settimana e contatori
  useEffect(() => {
    const fetchData = async () => {
      try {
        const weekRes = await axios.get<ActivityMap>(`${API_URL}/${numericOffset}`);
        console.log("Attività ricevute:", weekRes.data);
        setActivities(weekRes.data || {});
      } catch (error) {
        console.warn("Settimana non trovata o errore:", error);
        setActivities({} as ActivityMap);
      }

      try {
        const countersRes = await axios.get<SpaceCounters>(`${API_URL}/counters/${CURRENT_YEAR}`);
        setCounters(countersRes.data || {});
      } catch (error) {
        console.error("Errore nel caricamento dei contatori:", error);
      }
    };

    fetchData();
  }, [numericOffset]);

  
  //HandleCellClick
   const handleCellClick = (slot: string) => {
    // if (userRole === 'docente') return;
    setSelectedSlot(slot);
    const existing = activities[slot];
    setFormData(existing || { classe: '', risorse: '', spazio: '' });
    setShowModal(true);
  };
  
  
  //handleConfirm
  const handleConfirm = () => {
    if (!selectedSlot) return;
    const oldAct = activities[selectedSlot];
    const newAct = { ...formData };
    
    setCounters(prev => {
      const next = { ...prev };
      if (oldAct && oldAct.spazio !== newAct.spazio) {
        // Decrementa lo spazio vecchio
        next[oldAct.spazio] = Math.max((next[oldAct.spazio] || 1) - 1, 0);
        // Incrementa lo spazio nuovo
        next[newAct.spazio] = (next[newAct.spazio]||0) +1;
      } else if (!oldAct) {
        // Nuova prenotazione: incrementa il nuovo spazio
        next[newAct.spazio] = (next[newAct.spazio]||0) +1;
      }
      return next;
    });
    // Salva la nuova attività nello slot selezionato
    setActivities(prev => ({ ...prev, [selectedSlot]: newAct }));
    // Chiudi la modale
    setShowModal(false);
  };
  
  
  //handledelete
  const handleDelete = (slot: string) => {
    const oldAct = activities[slot];
    if (!oldAct) return;
    setCounters(prev => ({
      ...prev,
      [oldAct.spazio]: Math.max((prev[oldAct.spazio]||1) -1, 0)
    }));
    setActivities(prev => {
      const next = { ...prev };
      delete next[slot];
      return next;
    });
  };
  
  //handleSave
    const handleSave = async () => {
      if (!activities || Object.keys(activities).length === 0) {
       setAlert({ type: "warning", message: "Nessuna attività da salvare." });
       // nascondi alert dopo 3 secondi
      setTimeout(() => setAlert(null), 3000);
      // alert("Nessuna attività da salvare.");
      return;
    }
    try {
      await axios.post(`${API_URL}/${numericOffset}`, { activities });
      setAlert({ type: "success", message: "Atividades e contadores salvos com sucesso!" });
       // nascondi alert dopo 3 secondi
      setTimeout(() => setAlert(null), 3000);
      // alert("Attività salvate con successo!");
      await axios.post(`${API_URL}/counters/${CURRENT_YEAR}`, counters);
      // alert("Attività e contatori salvati con successo!");
    } catch(err) {
      console.error("Errore nel salvataggio:", err);
       setAlert({ type: "danger", message: "Errore durante il salvataggio." });

      setTimeout(() => setAlert(null), 3000);
      // alert("Errore durante il salvataggio.");
    }
  };

  const { start, end } = getWeekDates(numericOffset);
  const MAX_WEEK = 51, MIN_WEEK = 0;
  
    useEffect(() => {
    if (numericOffset < MIN_WEEK || numericOffset > MAX_WEEK) {
      navigate(`/settimana/${Math.min(Math.max(numericOffset, MIN_WEEK), MAX_WEEK)}`);
    }
  }, [numericOffset, navigate]);

  
  return (
    <div className="container">
      <div>
        <img style={{ maxWidth: "100%", width:420, marginTop: -50}} src={imgHead} alt="head" />
      </div>
      <div className='title-calendar'>
        Escola Municipal<br />Augusto Dos Anjos
      </div>
        <div className='sub-title-calendar'>Atividades Escolares</div>
        <div className='augusto-prato'>
          <img className='img-augusto' src={imgAugusto} alt="augusto" />
          <div style={{marginTop: -150}}>
          <img className="img-prato" src={imgPrato} alt="prato" />
        </div> 
      </div>
      <div className="d-flex justify-content-between align-items-center mb-3" style={{marginTop:450}}>
        <img src={imgArrow} alt="precendente" className='buttonWeekLeft' onClick={() => navigate(`/settimana/${numericOffset-1}`)} />
        <h5 className="scroll-week mb-0">Semana <strong style={{color:"red"}}>de</strong> {start} <strong style={{color:"red"}}>a</strong> {end}</h5>
        <img src={imgArrow} alt="successivo" className='buttonWeekRight' onClick={() => navigate(`/settimana/${numericOffset+1}`)} />
      </div>

      <div className="table-responsive"  style={{marginTop:40}}>
        <table className="table table-bordered text-center align-middle" style={{ minWidth: '800px' }}>
          <thead>
            <tr>
              <th style={{ backgroundColor: '#32bba5', color: 'white' }}>Horário</th>
              {daysOfWeek.map((day) =>
                <th key={day} style={{ backgroundColor: '#32bba5', color: 'white' }} >{day}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map(time => (
              <tr key={time}>
                <th style={{backgroundColor: '#D6914B', color:'white'}}>{time}</th>
                {daysOfWeek.map((day) => {
                  const key = `${day}-${time}`;
                  const activity = activities[key];
                  return (
                    <td key={key} style={{ cursor: 'pointer', height: '100px', position: 'relative' }}
                      onClick={() => handleCellClick(key)} >
                      {activity ? (
                        <>
                            {/* Puntino verde in alto a sinistra */}
                            <div style={{
                              position: "absolute",
                              top: "5px",
                              left: "5px",
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              backgroundColor: "red"
                            }}></div>
                          <div className="fw-bold">{activity.classe}</div>
                          <div>{activity.risorse}</div>
                          <div>{activity.spazio}</div>
                          <div className="text-danger small mt-1">RESERVADA</div>
                          <div className="position-absolute top-0 start-0 m-1">
                            <span className="badge bg-danger rounded-circle" style={{ width: '10px', height: '10px' }} />
                          </div>
                          {userRole === 'docente' && (
                            <Button variant="" size="sm" className="position-absolute bottom-0 end-0 m-0"
                              onClick={e => { e.stopPropagation(); handleDelete(key); }}>
                              <img src={imgDelete} alt="delete" style={{ height: 20 }} />
                            </Button>
                          )}
                        </>
                      ) : (
                          <>
                            {/* Puntino verde in alto a sinistra */}
                            <div style={{
                              position: "absolute",
                              top: "5px",
                              left: "5px",
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              backgroundColor: "green"
                            }}></div>
                            <div className="text-muted small">
                              <strong style={{ fontFamily: "Trebuchet MS", fontSize: 16, color: "green" }}>LIVRE</strong>
                            </div>
                            <div className="position-absolute top-0 start-0 m-1">
                              <span className="badge bg-success rounded-circle"
                                style={{ backgroundColor: "green", width: '40px', height: '40px' }} />
                            </div>
                        </>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <thead>
            <tr>
              <th style={{ backgroundColor: '#32bba5', color: 'white' }}>Horário</th>
              {daysOfWeek.map((day) => <th style={{ backgroundColor: '#32bba5', color: 'white' }} key={day}>{day}
              </th>)}
            </tr>
          </thead>
        </table>
      </div>
      
      <div className="img-save-ativitade mt-3 text-end">
        <img
          className="img-save"
          style={{ marginTop: 20, width: 60 }}
          src={imgSaveAtivitade}
          alt="save-ativitade"
          onClick={handleSave}
        />
        {/* Alert dinamico */}
        {alert && (
        <div className={`alert alert-${alert.type} alert-dismissible fade show mt-3`} role="alert">
          {alert.message}
          <button
            type="button"
            className="btn-close"
            aria-label="Close"
            onClick={() => setAlert(null)}
          ></button>
        </div>
      )}
      </div>

      <div className="mt-5">
        <h6 className='contador-espacos' style={{ textTransform: 'uppercase' }}>
          Contador de uso dos espaços <br /> (anual)
        </h6>
        <ul className="list-group mt-4">
          {(Object.keys(counters) as Spazio[]).map((space) => (
            <li key={space} className="list-group-item d-flex justify-content-between align-items-center" style={{ fontFamily: 'Allan'}}>
              <div className="d-flex align-items-center gap-2">
                <img src={icons[space]} alt={space} style={{ width: 100, height: 80, borderRadius: '10%' }}/>
                <span style={{fontSize: 22}}>{space}</span>
              </div>
              <span style={{ fontSize: '2.0rem' }}>
                {counters[space] || 0}</span>
            </li>
          ))}
        </ul>
        <footer className="text-center mt-5 mb-3 text-muted" style={{ fontSize: '0.9rem' }}>
          ©{new Date().getFullYear()} Created by Francesco Rapisarda<br /><strong>All rights reserved.</strong>
        </footer>
      </div>
      
      {/* Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>
            Agendar atividade
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <img className='ativitade-escolar' src={imgAtivitadeEscolar} alt="img-agendar-ativitade" />
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Turma</Form.Label>
              <Form.Select value={formData.classe} onChange={e => setFormData({ ...formData, classe: e.target.value })}>
                <option value=""> Selecione uma turma</option>
                {classes.map(c => <option key={c}>{c}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Recurso</Form.Label>
              <Form.Select value={formData.risorse} onChange={e => setFormData({ ...formData, risorse: e.target.value })}>
                <option value="">Selecione um recurso</option>
                {resources.map(r => <option key={r}>{r}</option>)}
              </Form.Select>
            </Form.Group>
            <Form.Group>
              <Form.Label>Espaço</Form.Label>
              <Form.Select value={formData.spazio} onChange={(e) => setFormData({ ...formData, spazio: e.target.value as Spazio })}>
                <option value="">Selecione um espaço</option>
                {spaces.map(s => <option key={s}>{s}</option>)}
              </Form.Select>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleConfirm} disabled={!formData.classe || !formData.risorse || !formData.spazio}>
            Confirmar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CalendarWeek;
