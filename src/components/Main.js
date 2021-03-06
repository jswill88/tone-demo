import React, { useEffect, useState } from 'react';
import * as Tone from 'tone';
import { Slider } from '@material-ui/core';
import { StylesProvider } from "@material-ui/core/styles";
import StopIcon from '@material-ui/icons/Stop';

import '../styles/App.scss';
import Squares from './Squares';
import Notes from './Notes';
import PlayButton from './PlayButton';
import useTempo from '../hooks/useTempo';
import { makeSynth, makeLoop } from '../modules/synth';


/**
 * @name Main - Main body of the application that encompasses the 
 * controls, and the blinking squares.
 */
export default function Main() {

  const [leftRhythm, setLeftRhythm] = useState(3);
  const [rightRhythm, setRightRhythm] = useState(4);
  const [leftHighlight, setLeftHighlight] = useState(-1);
  const [rightHighlight, setRightHighlight] = useState(-1);
  const [leftNote, setLeftNote] = useState('C4')
  const [rightNote, setRightNote] = useState('F3')
  const [leftError, setLeftError] = useState(false);
  const [rightError, setRightError] = useState(false);
  const [volume, setVolume] = useState(-20);
  const [started, setStarted] = useState(false)
  
  const [tempo, setTempo] = useTempo(rightRhythm);

  /**
   * @name setTimers - Starts the loop that plays the music and
   * highlights the squares as the music happens
   */
  const setTimers = async () => {
    
    setLeftHighlight(-1);
    setRightHighlight(-1);
    await Tone.start();
    setStarted(true);
    Tone.Destination.volume.value = volume;
    Tone.Transport.start('+0.1');
  }

  /**
   * Set up the initial levels and builds the synths to be used.
   */
  useEffect(() => {
    if (started) {
      const gainNode = new Tone.Gain(.6);
      const leftPanner = new Tone.Panner(1)// (.85)
      const rightPanner = new Tone.Panner(-1)//(-.85)
      const synth = makeSynth(leftPanner, gainNode);
      const synth2 = makeSynth(rightPanner, gainNode);
      let lLoop = makeLoop(leftRhythm, synth, leftNote, rightRhythm, setLeftHighlight)
      let rLoop = makeLoop(rightRhythm, synth2, rightNote, leftRhythm, setRightHighlight)

      return () => {
        lLoop.cancel()
        rLoop.cancel();
      }
    }
  }, [rightRhythm, leftRhythm, leftNote, rightNote, started])


  /** Updates the volume when changed */
  useEffect(() => {
    if (started) {
      Tone.Destination.volume.rampTo(
        (volume < -40) ? -100 : volume,
        .2)
    }
  }, [volume, started])

  /** Updates the tempo when changed */
  useEffect(() => {
    if (started) {
      Tone.Transport.bpm.rampTo(tempo * rightRhythm,.2);
    }
  }, [tempo, rightRhythm, started])

  /** Stop the music and blinking */
  const stop = async () => {
    unhighlight();
    Tone.Destination.volume.rampTo(-100, .3)
    Tone.Transport.stop('+0.1');
  }

  /** Unhighlight the squares */
  const unhighlight = () => {
    setRightHighlight(-4)
    setLeftHighlight(-4)
  }

  /** Change how many notes to play on the left side */
  const handleLeft = event => {
    if (event.target.value > 1 && event.target.value <= 150) {
      setLeftError(false);
      setLeftRhythm(event.target.value)
    } else {
      setLeftError(true);
    }
  };

  /** Change how many notes to play on the right side */
  const handleRight = event => {
    if (event.target.value > 1 &&
      event.target.value <= Math.floor(parseInt(leftRhythm) * 6)) {
      setRightError(false);
      setRightRhythm(event.target.value)
    } else {
      setRightError(true);
    }
  };

  /** Change the volume */
  const handleVolume = (e, value) => setVolume(value);

  /** Thumb component for the volume slider */
  function Thumb(props) {
    let value = (props['aria-valuenow'] + 40) / 5 + 1
    return (
      <span {...props}>
        <span>
          {value}
        </span>
      </span>)
  };

  /** Component for the subtitles */
  const SubTitle = ({ text }) => <div className="subtitle"><h2>{text}</h2></div>
  
  return (

    <main>

      <section className="globalControls">
        <StylesProvider injectFirst>

          <div
            title="Set the tempo for the base rhythm"
            className="control"
          >
            <label htmlFor="tempo">BPM: {tempo}</label>
            {setTempo}
          </div>

          <div
            title="Set the master volume"
            className="control"
          >
            <label htmlFor="volume">Volume</label>
            <Slider
              name="volume"
              aria-label="volume"
              min={-45}
              max={-5}
              step={5}
              value={volume}
              onChange={handleVolume}
              ThumbComponent={Thumb}
            />
          </div>

          <div title="Start and stop the music" className={"control"}>
            {leftHighlight > -1
              ? <button id='button' className="stop" onClick={stop}>
                <StopIcon /></button>
              : <PlayButton setTimers={setTimers} />
            }
          </div>
        </StylesProvider>
      </section>

      <div className="container">
        <div className="blinkBox">

          <SubTitle text="Base Rhythm" />

          <div className="sideHeader">

            <div
              className="sideControl"
              title="Set the number of beats in the base rhythm"
            >

              <label htmlFor="leftSub">Beats:</label>

              <input
                className={leftError ? 'error' : null}
                id="leftSub"
                type="number"
                min="2"
                max="150"
                defaultValue={leftRhythm}
                onChange={handleLeft}
              />
            </div>

            <div
              className="sideControl"
              title="Set the pitch of the left note"
            >
              {leftError
                ? <p>Input must be between 2 and 150</p>
                : Notes({
                  noteArray: ['Bb2', 'B2', 'C3', 'Db3', 'D3', 'Eb3', 'E3', 'F3', 'Gb3', 'G3', 'Ab3', 'A3'],
                  note: rightNote,
                  callback: setRightNote,
                })}
            </div>
          </div>

          <Squares
            rhythm={leftRhythm}
            otherRhy={rightRhythm}
            side='left'
            highlight={rightHighlight}
          />

        </div>

        <div className="blinkBox">
          <SubTitle text="Cross Rhythm" />

          <div className="sideHeader">

            <div
              className="sideControl"
              title="Set the number of beats in the cross rhythm">

              <label htmlFor="rightSub">Beats:</label>
              <input
                className={rightError ? 'error' : null}
                id="rightSub"
                type="number"
                min="2"
                max={Math.floor(parseInt(leftRhythm) * 6)}
                defaultValue={rightRhythm}
                onChange={handleRight} />
            </div>

            <div className="sideControl"
              title="Set the pitch of the right note">
              {rightError
                ? <p>
                  Input must be between 2 and {Math.floor(parseInt(leftRhythm) * 6)}
                </p>
                : Notes({
                  noteArray: ['Bb3', 'B3', 'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4'],
                  note: leftNote,
                  callback: setLeftNote,
                })
              }
            </div>

          </div>

          <Squares
            rhythm={rightRhythm}
            otherRhy={leftRhythm}
            side='right'
            highlight={leftHighlight}
          />

        </div>
      </div>
    </main>
  );
}
