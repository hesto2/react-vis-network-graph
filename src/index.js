import React, { Component } from "react";
import defaultsDeep from "lodash/fp/defaultsDeep";
import isEqual from "lodash/isEqual";
import differenceWith from "lodash/differenceWith";
import { Network, DataSet } from "vis-network/standalone";
import uuid from "uuid";
import PropTypes from "prop-types";

class Graph extends Component {
  constructor(props) {
    super(props);
    const { identifier } = props;
    this.updateGraph = this.updateGraph.bind(this);
    this.state = {
      identifier: identifier !== undefined ? identifier : uuid.v4(),
    };
    this.container = React.createRef();
  }

  componentDidMount() {
    this.edges = new DataSet(this.props.graph.edges);
    this.nodes = new DataSet(this.props.graph.nodes);
    this.updateGraph();
  }

  shouldComponentUpdate(nextProps, nextState) {
    let nodesChange = !isEqual(this.props.graph.nodes, nextProps.graph.nodes);
    let edgesChange = !isEqual(this.props.graph.edges, nextProps.graph.edges);
    let optionsChange = !isEqual(this.props.options, nextProps.options);
    let eventsChange = !isEqual(this.props.events, nextProps.events);

    if (nodesChange) {
      const idIsEqual = (n1, n2) => n1.id === n2.id;
      const nodesRemoved = differenceWith(
        this.props.graph.nodes,
        nextProps.graph.nodes,
        idIsEqual
      );
      const nodesAdded = differenceWith(
        nextProps.graph.nodes,
        this.props.graph.nodes,
        idIsEqual
      );
      const nodesChanged = differenceWith(
        differenceWith(nextProps.graph.nodes, this.props.graph.nodes, isEqual),
        nodesAdded
      );
      this.patchNodes({ nodesRemoved, nodesAdded, nodesChanged });
    }

    if (edgesChange) {
      const idIsEqual = (p1, p2) => p1.id === p2.id;
      const edgesRemoved = differenceWith(
        this.props.graph.edges,
        nextProps.graph.edges,
        idIsEqual
      );
      const edgesAdded = differenceWith(
        nextProps.graph.edges,
        this.props.graph.edges,
        idIsEqual
      );
      const edgesChanged = differenceWith(
        differenceWith(nextProps.graph.edges, this.props.graph.edges, isEqual),
        edgesAdded
      );
      this.patchEdges({ edgesRemoved, edgesAdded, edgesChanged });
    }

    if (optionsChange) {
      this.Network.setOptions(nextProps.options);
    }

    if (eventsChange) {
      let events = this.props.events || {};
      for (let eventName of Object.keys(events))
        this.Network.off(eventName, events[eventName]);

      events = nextProps.events || {};
      for (let eventName of Object.keys(events))
        this.Network.on(eventName, events[eventName]);
    }

    return false;
  }

  componentDidUpdate() {
    this.updateGraph();
  }

  patchEdges({ edgesRemoved, edgesAdded, edgesChanged }) {
    this.edges.remove(edgesRemoved);
    this.edges.add(edgesAdded);
    this.edges.update(edgesChanged);
  }

  patchNodes({ nodesRemoved, nodesAdded, nodesChanged }) {
    this.nodes.remove(nodesRemoved);
    this.nodes.add(nodesAdded);
    this.nodes.update(nodesChanged);
  }

  updateGraph() {
    let defaultOptions = {
      physics: {
        stabilization: false,
      },
      autoResize: false,
      edges: {
        smooth: false,
        color: "#000000",
        width: 0.5,
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.5,
          },
        },
      },
    };

    // merge user provied options with our default ones
    let options = defaultsDeep(defaultOptions, this.props.options);

    const data = {
      nodes: this.nodes,
      edges: this.edges,
    };

    this.Network = new Network(this.container.current, data, options);

    if (this.props.getNetwork) {
      this.props.getNetwork(this.Network);
    }

    if (this.props.getNodes) {
      this.props.getNodes(this.nodes);
    }

    if (this.props.getEdges) {
      this.props.getEdges(this.edges);
    }

    // Add user provied events to network
    let events = this.props.events || {};
    for (let eventName of Object.keys(events)) {
      this.Network.on(eventName, events[eventName]);
    }
  }

  render() {
    const { identifier } = this.state;
    const { style } = this.props;
    return React.createElement(
      "div",
      {
        id: identifier,
        ref: this.container,
        style,
      },
      identifier
    );
  }
}

Graph.defaultProps = {
  graph: {},
  style: { width: "100%", height: "100%" },
};
Graph.propTypes = {
  graph: PropTypes.object,
  style: PropTypes.object,
  getNetwork: PropTypes.func,
  getNodes: PropTypes.func,
  getEdges: PropTypes.func,
};

export default Graph;
